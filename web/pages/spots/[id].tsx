import { useRouter } from 'next/router';

export default function SpotPage() {
  const router = useRouter();
  const { id } = router.query;
  return <div>Spot {id as string}</div>;
}
