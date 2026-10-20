// --- Enums ---

export type UserRole = "admin" | "teacher" | "student";
export type DocumentStatus = "pending" | "processing" | "completed" | "failed";
export type DocumentType = "pdf" | "text" | "md";

// --- Auth ---

export interface UserCreate {
    email: string;
    password: string;
    display_name?: string | null;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface UserResponse {
    uid: string;
    email: string;
    email_verified: boolean;
    display_name?: string | null;
    photo_url?: string | null;
    provider_id: string;
    created_at: string;
    role?: UserRole | null;
}

export interface User {
    uid: string;
    email: string;
    email_verified: boolean;
    display_name?: string | null;
    photo_url?: string | null;
    provider_id: string;
    created_at: string;
    last_sign_in_at?: string | null;
    role?: UserRole | null;
}

export interface LoginTokens {
    access_token?: string;
    refresh_token: string;
    id_token: string;
    expires_in?: number;
    token_type?: string;
}

export interface LoginResponse {
    user: UserResponse;
    tokens: LoginTokens;
}

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface RefreshTokenResponse {
    id_token: string;
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    oob_code: string;
    new_password: string;
}

export interface UpdateProfileRequest {
    display_name: string | null;
}

export interface SetRoleRequest {
    role: UserRole;
}

export interface MessageResponse {
    message: string;
}

export interface DashboardResponse {
    message: string;
}

// --- Documents ---

export interface DocumentMetadata {
    id: string;
    user_id: string;
    filename: string;
    file_type: DocumentType;
    file_size: number;
    chunks_count: number;
    status: DocumentStatus;
    created_at: string;
    updated_at?: string | null;
    error_message?: string | null;
}

export interface DocumentResponse {
    id: string;
    message: string;
    document: DocumentMetadata;
}

export interface DocumentListResponse {
    documents: DocumentMetadata[];
    total: number;
}

export interface DocumentChunk {
    document_id: string;
    chunk_index: number;
    content: string;
    embedding?: number[] | null;
}

export interface DocumentChunksResponse {
    document_id: string;
    chunks: DocumentChunk[];
    total: number;
}

export interface UploadError {
    filename: string;
    error: string;
}

export interface BatchUploadResponse {
    successful: DocumentResponse[];
    failed: UploadError[];
}

export interface UploadOptions {
    chunk_size?: number;   // default: 500
    chunk_overlap?: number; // default: 50
}

export interface HealthCheckResponse {
    redis_connected: boolean;
    embedding_model_loaded: boolean;
}

export interface FlashcardCitation {
    chunk_id: string;
    doc_id?: string | null;
    quote?: string | null;
}

export interface Flashcard {
    card_id: string;
    user_id: string;
    concept_ids: string[];
    question: string;
    answer: string;
    explanation: string;
    concept_tags: string[];
    citations: FlashcardCitation[];
    created_at: string;
}

export interface FlashcardGenerateRequest {
    user_id: string;
    topic?: string;
    goal?: string;
    genre: string;
    mode?: string;
}

export interface FlashcardGenerateResponse {
    cards: Flashcard[];
}

export interface FlashcardListResponse {
    cards: Flashcard[];
    total: number;
}

export interface ChatSource {
    subject: string;
    topic_path: string[];
    content: string;
}

export interface ChatSessionCreateRequest {
    title?: string | null;
    message?: string | null;
}

export interface ChatSessionResponse {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface ChatSessionListResponse {
    sessions: ChatSessionResponse[];
    next_cursor?: string | null;
    total: number;
}

export interface ChatMessageCreateRequest {
    content: string;
}

export interface ChatMessageResponse {
    id: string;
    session_id: string;
    role: "user" | "assistant" | "system";
    content: string;
    sources?: ChatSource[] | null;
    created_at: string;
}

export interface ChatMessageListResponse {
    messages: ChatMessageResponse[];
    next_cursor?: string | null;
    total: number;
}

// --- Quizzes ---

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizCitation {
    chunk_id: string;
    doc_id?: string | null;
    quote?: string | null;
}

export interface QuizOption {
    id: string;
    text: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: QuizOption[];
}

export interface QuizGenerateRequest {
    topic: string;
    subject?: string | null;
    difficulty: QuizDifficulty;
    num_questions: number;
}

export interface QuizSummary {
    id: string;
    title: string;
    topic: string;
    subject?: string | null;
    difficulty: QuizDifficulty;
    num_questions: number;
    created_at: string;
    attempts_count: number;
    best_score?: number | null;
    last_score?: number | null;
}

export interface QuizDetail extends QuizSummary {
    questions: QuizQuestion[];
}

export interface QuizListResponse {
    quizzes: QuizSummary[];
    total: number;
}

export interface QuizAttemptRequest {
    answers: Record<string, string>;
}

export interface QuizQuestionResult {
    question_id: string;
    question: string;
    options: QuizOption[];
    selected_option_id?: string | null;
    correct_option_id: string;
    is_correct: boolean;
    explanation: string;
    citations: QuizCitation[];
}

export interface QuizAttemptResponse {
    attempt_id: string;
    quiz_id: string;
    score: number;
    total: number;
    percentage: number;
    results: QuizQuestionResult[];
    created_at: string;
}
