export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    role: user.role,
    verificationStatus: user.verificationStatus,
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    hasDocumentSubmitted: Boolean(user.documentDetails?.submittedAt),
    documentReview: user.documentDetails?.submittedAt ? {
      submittedAt: user.documentDetails.submittedAt,
      reviewedAt: user.documentDetails.reviewedAt || null,
      reviewNotes: user.documentDetails.reviewNotes || null,
      rejectionReason: user.documentDetails.rejectionReason || null,
      fileName: user.documentDetails.originalName || null
    } : null,
    createdAt: user.createdAt
  };
}
export function publicReport(report) {
  const value = report?.toObject ? report.toObject() : { ...report };
  delete value.reporterId;
  delete value.moderationNote;
  return value;
}
