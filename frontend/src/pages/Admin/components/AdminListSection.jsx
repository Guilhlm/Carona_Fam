import AdminPagination from '../AdminPagination';
import { ADMIN_LIST_PAGINATION_GAP_PX } from './adminConstants';

export default function AdminListSection({ pagination, page, onPageChange, children }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col h-full w-full min-w-0">
      <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{ marginBottom: ADMIN_LIST_PAGINATION_GAP_PX }}
      >
        <div className="flex-1 min-h-0 h-full w-full flex flex-col">{children}</div>
      </div>
      <AdminPagination
        className="shrink-0 pt-0 mt-auto"
        pagination={pagination}
        page={page}
        onPageChange={onPageChange}
      />
    </div>
  );
}
