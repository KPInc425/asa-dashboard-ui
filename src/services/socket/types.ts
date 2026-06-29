export interface LogMessage {
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
    container: string;
}

export interface JobProgress {
    jobId: string;
    status: "running" | "completed" | "failed" | "cancelled";
    progress: number;
    message: string;
    step?: string;
    error?: string;
    result?: any;
}

export interface SocketEvents {
    log: (data: LogMessage) => void;
    "job-progress": (data: JobProgress) => void;
    connect: () => void;
    disconnect: (reason: string) => void;
    connect_error: (error: Error) => void;
    error: (error: Error) => void;
}
