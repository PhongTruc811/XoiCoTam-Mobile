import { BossView } from '@/features/order/boss';
import { RoleWorkspace } from '@/features/order/screen';
import { DailyPostView } from '@/features/daily-post/screen';

export default function BossScreen() {
  return <RoleWorkspace role="boss">{page => page === 'daily-post' ? <DailyPostView /> : <BossView page={page} />}</RoleWorkspace>;
}
