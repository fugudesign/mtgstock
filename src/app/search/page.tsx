import { PageHeader } from "@/components/PageHeader";
import { SearchClient } from "@/components/search";
import { Container } from "@/components/ui/container";

export default function SearchPage() {
  return (
    <Container>
      <PageHeader
        title="Rechercher des cartes"
        subtitle="Parmi plus de 30 000 cartes Magic: The Gathering"
        className="mb-0 pb-2"
      />
      <SearchClient />
    </Container>
  );
}
