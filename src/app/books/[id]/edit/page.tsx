import EditBookClient from "@/components/EditBookClient";

export default function EditBookPage({ params }: { params: { id: string } }) {
  return <EditBookClient id={params.id} />;
}
