import { PageHeader } from "@/components/PageHeader";
import { SearchClient } from "@/components/search";
import { Container } from "@/components/ui/container";

export default function SearchPage() {
  return (
    <Container>
      <PageHeader
        title="Recherche de cartes"
        subtitle="Recherchez parmi plus de 30 000 cartes Magic: The Gathering"
      />
      <SearchClient />
    </Container>
  );
}
