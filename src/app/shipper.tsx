import { RoleWorkspace } from '@/features/order/screen';
import { ShipperView } from '@/features/order/shipper';

export default function ShipperScreen() {
  return <RoleWorkspace role="shipper">{page => <ShipperView page={page} />}</RoleWorkspace>;
}
