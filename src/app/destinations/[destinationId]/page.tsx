import DestinationClient from './DestinationClient'

export default async function DestinationDetailPage({ params }: { params: Promise<{ destinationId: string }> }) {
  const { destinationId } = await params
  return <DestinationClient destinationId={destinationId} />
}
