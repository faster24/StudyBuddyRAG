import { FileText, Library, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import {
	type ChangeEvent,
	type DragEvent,
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import DocumentService from "@/services/documentService";
import type { DocumentMetadata, DocumentStatus } from "@/types/type";

// Must match the backend's ALLOWED_FILE_TYPES (pdf, txt, md)
const allowedExtensions = [".pdf", ".txt", ".md"];
const acceptedTypesLabel = "PDF, TXT or Markdown";
const maxFileSizeMb = 50;

const statusBadgeStyles: Record<DocumentStatus, string> = {
	pending: "border-warning/40 bg-warning/10 text-warning",
	processing: "border-info/40 bg-info/10 text-info",
	completed: "border-success/40 bg-success/10 text-success",
	failed: "border-destructive/40 bg-destructive/10 text-destructive",
};

const statusLabel: Record<DocumentStatus, string> = {
	pending: "Pending",
	processing: "Processing",
	completed: "Ready",
	failed: "Failed",
};

function hasAllowedExtension(fileName: string) {
	const lowerCasedName = fileName.toLowerCase();
	return allowedExtensions.some((extension) =>
		lowerCasedName.endsWith(extension),
	);
}

const formatFileSize = (bytes: number) =>
	bytes < 1024 * 1024
		? `${Math.max(1, Math.round(bytes / 1024))} KB`
		: `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatCreatedAt = (createdAt: string) => {
	const parsedDate = new Date(createdAt);
	if (Number.isNaN(parsedDate.getTime())) {
		return createdAt;
	}
	return parsedDate.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

export default function Documents() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
	const [isListLoading, setIsListLoading] = useState(true);
	const [listError, setListError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchDocuments = useCallback(async () => {
		setIsListLoading(true);
		setListError(null);

		try {
			const response = await DocumentService.list();
			setDocuments(response.documents);
		} catch (error) {
			setListError(
				getErrorMessage(error, "We couldn't load your knowledge base right now."),
			);
		} finally {
			setIsListLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchDocuments();
	}, [fetchDocuments]);

	const selectFile = (file: File | null) => {
		setUploadError(null);

		if (!file) {
			setSelectedFile(null);
			setValidationError(null);
			return;
		}
		if (!hasAllowedExtension(file.name)) {
			setSelectedFile(null);
			setValidationError(`"${file.name}" isn't supported. Choose a ${acceptedTypesLabel} file.`);
			return;
		}
		if (file.size > maxFileSizeMb * 1024 * 1024) {
			setSelectedFile(null);
			setValidationError(`"${file.name}" is larger than ${maxFileSizeMb} MB.`);
			return;
		}

		setSelectedFile(file);
		setValidationError(null);
	};

	const clearSelection = () => {
		selectFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		selectFile(event.target.files?.[0] ?? null);
	};

	const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		if (!isUploading) {
			setIsDragging(true);
		}
	};

	const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragging(false);
		if (!isUploading) {
			selectFile(event.dataTransfer.files?.[0] ?? null);
		}
	};

	const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selectedFile || validationError || isUploading) {
			return;
		}

		setIsUploading(true);
		setUploadError(null);

		try {
			const response = await DocumentService.upload(selectedFile);
			toast.success(`${response.document.filename} is ready`, {
				description: `${response.document.chunks_count} sections indexed for the tutor.`,
			});
			clearSelection();
			await fetchDocuments();
		} catch (error) {
			setUploadError(getErrorMessage(error, "Upload failed. Try again in a moment."));
			// A failed upload is still recorded with its reason, so refresh the list
			await fetchDocuments();
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = async (document: DocumentMetadata) => {
		if (!window.confirm(`Delete "${document.filename}"? The tutor will no longer use it.`)) {
			return;
		}

		try {
			setDeletingId(document.id);
			await DocumentService.delete(document.id);
			setDocuments((current) => current.filter((item) => item.id !== document.id));
			toast.success("Document deleted");
		} catch (error) {
			toast.error(getErrorMessage(error, "Failed to delete document"));
		} finally {
			setDeletingId(null);
		}
	};

	const readyCount = documents.filter((doc) => doc.status === "completed").length;

	return (
		<main className="w-full space-y-6">
			<PageHeader
				icon={Library}
				title="Knowledge Base"
				description="Upload your notes and past papers. StudyBuddy uses them in chat, flashcards and quizzes."
			/>

			<Card>
				<CardHeader>
					<CardTitle>Upload materials</CardTitle>
					<CardDescription>
						{acceptedTypesLabel}, up to {maxFileSizeMb} MB. Scanned PDFs (images of text) can&apos;t be read yet.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleUpload}>
						<label
							htmlFor="documents-file-input"
							onDragOver={handleDragOver}
							onDragLeave={() => setIsDragging(false)}
							onDrop={handleDrop}
							className={cn(
								"flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200",
								"focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40",
								isDragging
									? "border-primary bg-primary/5"
									: "border-border hover:border-primary/50 hover:bg-muted/50",
								isUploading && "pointer-events-none opacity-60",
							)}
						>
							<div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
								<UploadCloud className="size-6" />
							</div>
							<p className="text-sm font-medium">
								<span className="text-primary">Click to choose a file</span> or drag it here
							</p>
							<p className="text-xs text-muted-foreground">{acceptedTypesLabel}</p>
							<input
								ref={fileInputRef}
								id="documents-file-input"
								type="file"
								accept={allowedExtensions.join(",")}
								onChange={handleFileChange}
								disabled={isUploading}
								className="sr-only"
								aria-describedby="documents-status-msg"
								data-testid="documents-file-input"
							/>
						</label>

						{selectedFile ? (
							<div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
								<div className="flex min-w-0 items-center gap-2">
									<FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
									<span className="truncate text-sm font-medium">{selectedFile.name}</span>
									<span className="shrink-0 text-xs text-muted-foreground">
										{formatFileSize(selectedFile.size)}
									</span>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-8 shrink-0"
									onClick={clearSelection}
									disabled={isUploading}
									aria-label="Remove selected file"
								>
									<X className="size-4" />
								</Button>
							</div>
						) : null}

						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="submit"
								disabled={isUploading || !selectedFile || Boolean(validationError)}
								data-testid="documents-upload-btn"
							>
								{isUploading ? <Spinner className="size-4" /> : <UploadCloud className="size-4" />}
								{isUploading ? "Processing…" : "Upload"}
							</Button>
							<output
								id="documents-status-msg"
								className={cn(
									"text-sm",
									validationError || uploadError ? "text-destructive" : "text-muted-foreground",
								)}
								aria-live="polite"
								data-testid="documents-status-msg"
							>
								{validationError ??
									uploadError ??
									(isUploading
										? "Reading and indexing your file. Larger PDFs can take a minute."
										: null)}
							</output>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
					<div className="space-y-1">
						<CardTitle>Your files</CardTitle>
						<CardDescription>
							{documents.length > 0
								? `${readyCount} of ${documents.length} ready for the tutor`
								: "Files you upload appear here."}
						</CardDescription>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => void fetchDocuments()}
						disabled={isListLoading}
						aria-label="Refresh file list"
					>
						<RefreshCw className={cn("size-4", isListLoading && "animate-spin")} />
					</Button>
				</CardHeader>
				<CardContent data-testid="documents-list">
					{isListLoading && documents.length === 0 ? (
						<div className="space-y-2">
							{[0, 1].map((key) => (
								<Skeleton key={key} className="h-16 rounded-lg" />
							))}
						</div>
					) : listError ? (
						<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							<p>{listError}</p>
							<Button type="button" size="sm" variant="outline" onClick={() => void fetchDocuments()}>
								Try again
							</Button>
						</div>
					) : documents.length === 0 ? (
						<div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
							<FileText className="size-8 text-muted-foreground" aria-hidden="true" />
							<p className="font-medium">No files yet</p>
							<p className="max-w-sm text-sm text-muted-foreground">
								Upload class notes or practice questions, then ask the tutor about them or turn them into a quiz.
							</p>
						</div>
					) : (
						<ul className="divide-y">
							{documents.map((document) => (
								<li key={document.id} className="flex items-start justify-between gap-3 py-3">
									<div className="flex min-w-0 items-start gap-3">
										<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
											<FileText className="size-4" />
										</div>
										<div className="min-w-0 space-y-1">
											<p className="truncate text-sm font-medium">{document.filename}</p>
											<p className="text-xs text-muted-foreground">
												{[
													document.file_type.toUpperCase(),
													formatFileSize(document.file_size),
													document.status === "completed"
														? `${document.chunks_count} section${document.chunks_count === 1 ? "" : "s"}`
														: null,
													formatCreatedAt(document.created_at),
												]
													.filter(Boolean)
													.join(" · ")}
											</p>
											{document.status === "failed" && document.error_message ? (
												<p className="text-xs text-destructive">{document.error_message}</p>
											) : null}
										</div>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<span
											className={cn(
												"inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
												statusBadgeStyles[document.status],
											)}
										>
											{statusLabel[document.status]}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-9 text-muted-foreground hover:text-destructive"
											onClick={() => void handleDelete(document)}
											disabled={deletingId === document.id}
											aria-label={`Delete ${document.filename}`}
										>
											{deletingId === document.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
