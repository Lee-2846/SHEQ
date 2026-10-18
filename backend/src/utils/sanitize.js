export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    role: user.role,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt
  };
}
export function publicReport(report) {
  const value = report?.toObject ? report.toObject() : { ...report };
  delete value.reporterId;
  delete value.moderationNote;
  return value;
}
