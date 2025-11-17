import { create } from "zustand";

export interface Survey {
	id?: string;
	title: string;
	description: string;
	questions: any[];
	thankYouMessage: string;
	goal: string;
	user: string;
	_id?: string;
	createdAt?: string;
	updatedAt?: string;
    status: string;
    responses: number
}

type SurveysState = {
	surveys: Survey[];
};

type SurveysActions = {
	addSurvey: (survey: Survey) => void;
	setSurveys: (surveys: Survey[]) => void;
	updateSurvey: (id: string, updates: Partial<Survey>) => void;
	incrementSurveyResponse: (surveyId: string) => void;
	removeSurvey: (id: string) => void;
	reset: () => void;
};

export const useSurveysStore = create<SurveysState & SurveysActions>((set) => ({
	surveys: [],
	addSurvey: (survey) =>
		set((state) => {
			// Check if survey already exists (by id)
			const exists = state.surveys.some((s) => s._id === survey._id);
			if (exists) {
				// Update existing survey
				return {
					surveys: state.surveys.map((s) =>
						s._id === survey._id ? { ...s, ...survey } : s
					),
				};
			}
			// Add new survey
			return {
				surveys: [...state.surveys, survey],
			};
		}),
	setSurveys: (surveys) => set(() => ({ surveys })),
	updateSurvey: (id, updates) =>
		set((state) => ({
			surveys: state.surveys.map((s) =>
				s._id === id || s.id === id ? { ...s, ...updates } : s
			),
		})),
	incrementSurveyResponse: (surveyId) =>
		set((state) => ({
			surveys: state.surveys.map((s) => {
				if (s._id === surveyId || s.id === surveyId) {
					return { ...s, responses: (s.responses || 0) + 1 };
				}
				return s;
			}),
		})),
	removeSurvey: (id) =>
		set((state) => ({
			surveys: state.surveys.filter((s) => s._id !== id),
		})),
	reset: () => set(() => ({ surveys: [] })),
}));

