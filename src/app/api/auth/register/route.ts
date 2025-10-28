import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter (en production, utiliser Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure
const MAX_REQUESTS_PER_WINDOW = 3; // 3 inscriptions max par IP par heure

function getRateLimitKey(ip: string): string {
  return `register:${ip}`;
}

function checkRateLimit(ip: string): { allowed: boolean; resetTime?: number } {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Nouvelle fenêtre de temps
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, resetTime: record.resetTime };
  }

  // Incrémenter le compteur
  record.count++;
  rateLimitMap.set(key, record);
  return { allowed: true };
}

// Nettoyage périodique des anciennes entrées
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

// Fonction pour vérifier le token reCAPTCHA
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn("reCAPTCHA secret key not configured");
    return true; // Continuer sans vérification si pas configuré
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data = await response.json();

    // reCAPTCHA v3 retourne un score de 0.0 à 1.0
    // 1.0 = très probablement humain, 0.0 = très probablement bot
    if (data.success && data.score >= 0.5) {
      return true;
    }

    console.warn("reCAPTCHA verification failed:", data);
    return false;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return true; // En cas d'erreur, on laisse passer pour ne pas bloquer les vrais utilisateurs
  }
}

export async function POST(req: Request) {
  try {
    // Récupérer l'IP du client
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Vérifier le rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime!);
      return NextResponse.json(
        {
          error: `Trop de tentatives. Réessayez après ${resetDate.toLocaleTimeString(
            "fr-FR"
          )}`,
        },
        { status: 429 }
      );
    }

    const { email, password, name, language, recaptchaToken } =
      await req.json();

    // Vérifier reCAPTCHA si un token est fourni
    if (recaptchaToken) {
      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        return NextResponse.json(
          { error: "Échec de la vérification anti-bot" },
          { status: 403 }
        );
      }
    }

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        language: language || "en",
      },
      select: {
        id: true,
        email: true,
        name: true,
        language: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
