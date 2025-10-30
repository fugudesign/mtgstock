// Rate limiting partagé pour l'API Scryfall
// Scryfall recommande d'attendre 50-100ms entre chaque requête

let lastRequestTime = 0;

export async function throttleScryfallRequest(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  // Attendre au moins 100ms entre chaque requête (recommandation Scryfall)
  if (timeSinceLastRequest < 100) {
    await new Promise((resolve) =>
      setTimeout(resolve, 100 - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
}

// Fonction pour gérer les erreurs 429 avec retry automatique
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await throttleScryfallRequest();

    const response = await fetch(url, options);

    if (response.status === 429) {
      // Rate limited - attendre plus longtemps avant de réessayer
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : 1000 * attempt;

      console.warn(
        `Rate limited (429), waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
    }

    return response;
  }

  throw new Error(`Failed after ${maxRetries} retries`);
}
