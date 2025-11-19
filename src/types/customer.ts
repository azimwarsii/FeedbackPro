export interface Invitation {
	_id?: string;
	id?: string;
	customerId: string;
	campaignId: string;
	surveyId: string;
	status: "pending" | "sent" | "opened" | "completed" | "expired";
	sentAt?: string;
	openedAt?: string;
	completedAt?: string;
	expiresAt?: string;
	createdAt?: string;
	updatedAt?: string;
}

