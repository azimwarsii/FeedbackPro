export type QuestionType =
	| "short-text"
	| "long-text"
	| "multiple-choice"
	| "single-choice"
	| "rating-scale"
	| "date"
	| "email"
	| "phone"
	| "number"
	| "text"
	| "rating"
	| "yes-no";

export interface LogicRule {
	condition: string;
	value: string | number;
	action: string;
	targetQuestion?: string;
	targetQuestionId?: string;
}

export interface Question {
	id: string;
	type: QuestionType;
	title: string;
	description: string;
	required: boolean;
	options?: string[];
	ratingMax?: number;
	order: number;
	logic?: LogicRule[];
	logicRules?: LogicRule[];
}

export interface Answer {
	questionId: string;
	value: string | number | string[] | null;
}

