import StateExplorerClient from './StateExplorerClient'

export default async function StateExplorerPage({ params }: { params: Promise<{ stateId: string }> }) {
  const { stateId } = await params
  return <StateExplorerClient stateId={stateId} />
}
