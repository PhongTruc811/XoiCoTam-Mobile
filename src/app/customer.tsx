import { CustomerView } from '@/features/order/customer';
import { RoleWorkspace } from '@/features/order/screen';

export default function CustomerScreen() {
  return (
    <RoleWorkspace role="customer">
      {(page, navigate) => <CustomerView page={page} navigate={navigate} />}
    </RoleWorkspace>
  );
}
