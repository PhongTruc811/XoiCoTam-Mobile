import { RoleWorkspace } from '@/features/order/screen';
import { StaffView } from '@/features/order/staff';

export default function StaffScreen() {
  return <RoleWorkspace role="staff">{page => <StaffView page={page} />}</RoleWorkspace>;
}
