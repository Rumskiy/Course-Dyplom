export interface UserLogin {
    token: string;
    id: string;
    avatar: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
}

export interface RegisterUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface UpdateData {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    avatar_img?: string;
}

// Course Interfaces
export interface Course {
    id?: string;
    title: string;
    title_img?: [
        id: string,
        link: string,
        model_id: number,
    ];
    category_id: string;
    description: string;
    author_id?: string;
}

// Section Interfaces
export interface Section {
    id: string;
    title: string;
    contentSection: string;
    description: string;
    course_id: string;
    section_video?: string;
}

// Category Interfaces
export interface Categories {
    id: string;
    name: string;
}

export interface TestData {
    id: number;
    title: string;
    section_id: number;
    total_time_limit?: number | null;
    time_per_question?: number | null;
    questions?: ApiQuestion[]; // Масив питань
}

export interface ApiQuestion {
    id: number;
    type: 'single_choice' | 'multiple_choice' | 'match';
    text: string;
    order?: number;
    points?: number;
    image?: string | null;
    options?: ApiOption[]; // Для single/multiple choice
    match_pairs?: ApiMatchPair[]; // Масив пар для типу match
}

export interface ApiMatchPair {
    id: number;
    left_text: string;
    right_text: string;
    order?: number;
}

export interface ApiOption {
    id: number;
    text: string;
    is_correct: boolean;
    order?: number;
}

// Пропси для компонента GameOverScreen
export interface GameOverProps {
    score: number;
    totalQuestions: number;
    percentage: number;
    onRestart: () => void; // Функція для перезапуску тесту
}

// Пропси для компонента StartScreen
export interface StartScreenProps {
    testTitle: string;
    onStartQuiz: () => void; // Функція для початку тесту
}

// --- Типи для форми (відповідають стану фронтенду) ---
export interface OptionForm {
    text: string;
    is_correct: boolean;
    order: number; // Порядок важливий для збереження послідовності
}

export interface MatchPairForm {
    id?: number | string; // Може бути корисним при редагуванні, для ідентифікації
    left_text: string;
    right_text: string;
    order: number;
}

export interface QuestionForm {
    // id?: number; // Додається при редагуванні існуючого тесту
    type: 'single_choice' | 'multiple_choice' | 'match';
    text: string;
    order: number;
    points: number;
    options: OptionForm[];
    match_pairs: MatchPairForm[];
    image: File | null;              // локальний файл
    image_preview_url?: string | null;
    image_media_id?: number | null;
    existingImageUrl?: null;
    remove_image: boolean;
}

export interface TestFormValues {
    title: string;
    section_id: number | null; // Має бути числом або null перед завантаженням
    total_time_limit: number | string; // string, бо TextField може давати рядок
    time_per_question: number | string;
    questions: QuestionForm[];
}

// Тип для відповіді користувача (надсилається на бекенд)
export interface UserAnswerPayload {
    question_id: number;
    selected_option_ids?: number[];
    // Structure for match answers: map left_id to the selected right_id
    selected_pairs?: { left_id: number; selected_right_id: number }[];
}

// Тип для payload відправки результатів
export interface QuizResultPayload {
    test_id: number;
    answers: UserAnswerPayload[];
}

interface TestReference {
    id: number,
    title: string,
    section_id: number,
};

export interface QuizAttempt {
    id: number;
    score: number;
    total_questions: number;
    percentage: number;
    completed_at: string;
    completed_at_iso: string;
    test: TestReference | null;
    section_title: string | null;
    course_title: string | null;
}