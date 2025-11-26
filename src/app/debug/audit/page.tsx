import { db } from "@/shared/server/db";
import { auth } from "@/shared/server/auth";

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const auditLogs = await db.auditLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2">Timestamp</th>
            <th className="px-4 py-2">User ID</th>
            <th className="px-4 py-2">Action</th>
            <th className="px-4 py-2">Subject Type</th>
            <th className="px-4 py-2">Subject ID</th>
          </tr>
        </thead>
        <tbody>
          {auditLogs.map((log) => (
            <tr key={log.id}>
              <td className="border px-4 py-2">
                {log.createdAt.toLocaleString()}
              </td>
              <td className="border px-4 py-2">{log.userId}</td>
              <td className="border px-4 py-2">{log.action}</td>
              <td className="border px-4 py-2">{log.subjectType}</td>
              <td className="border px-4 py-2">{log.subjectId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
