import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { LogMessage, JobProgress } from "./types";

class SocketManager {
    private socket: Socket | null = null;
    private containerName: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private _runtimeUrl: string | null = null;

    setBaseUrl(url: string): void {
        this._runtimeUrl = url;
        if (this.socket?.connected) {
            const containerName = this.containerName;
            this.disconnect();
            if (containerName) {
                this.connect(containerName).catch(console.error);
            }
        }
    }

    private resolveSocketUrl(): string {
        if (this._runtimeUrl) return this._runtimeUrl.replace(/\/$/, "");
        const customEndpoint = localStorage.getItem("api_endpoint");
        if (customEndpoint) return customEndpoint.replace(/\/$/, "");
        const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;
        if (configuredSocketUrl && configuredSocketUrl !== "/") return configuredSocketUrl.replace(/\/$/, "");
        const configuredApiUrl = import.meta.env.VITE_API_URL;
        if (configuredApiUrl && configuredApiUrl !== "/") return configuredApiUrl.replace(/\/$/, "");
        return window.location.origin.replace(/\/$/, "");
    }

    private async checkBackendAvailability(url: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${url}/health`, { method: "GET", signal: controller.signal });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn("Backend health check failed:", error);
            return false;
        }
    }

    connect(containerName: string, logFile?: string): Promise<void> {
        return new Promise(async (resolve) => {
            if (this.socket?.connected) this.disconnect();
            this.containerName = containerName;
            const socketUrl = this.resolveSocketUrl();
            const token = localStorage.getItem("auth_token");

            const backendAvailable = await this.checkBackendAvailability(socketUrl);
            if (!backendAvailable) {
                console.warn("Backend server is not available, skipping Socket.IO connection");
                resolve();
                return;
            }

            this.socket = io(socketUrl, {
                path: "/socket.io/",
                transports: ["websocket", "polling"],
                timeout: 20000,
                forceNew: true,
                withCredentials: true,
                auth: { token: token || "" },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            });

            this.socket.on("connect", async () => {
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                try {
                    const socket = this.socket;
                    if (socket) {
                        if (logFile) {
                            socket.emit("start-ark-logs", { serverName: containerName, logFileName: logFile });
                        } else {
                            socket.emit("start-ark-logs", { serverName: containerName, logFileName: "ShooterGame.log" });
                        }
                    }
                    resolve();
                } catch (error: unknown) {
                    console.error("Error in socket connection setup:", error);
                    resolve();
                }
            });

            this.socket.on("disconnect", (reason: string) => {
                if (reason === "io server disconnect") this.socket = null;
            });

            this.socket.on("connect_error", (error: Error) => {
                console.warn("Socket.IO connection failed, using static logs only:", error);
                resolve();
            });

            this.socket.on("error", (error: Error) => {
                console.error("Socket error:", error);
            });

            this.socket.on("disconnect", (reason: string) => {
                if (reason === "io client disconnect") return;
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        if (this.containerName) this.connect(this.containerName).catch(console.error);
                    }, this.reconnectDelay);
                    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
                }
            });
        });
    }

    switchLogFile(logFile: string): void {
        if (this.socket?.connected && this.containerName) {
            this.socket.emit("stop-container-logs");
            this.socket.emit("stop-ark-logs");
            this.socket.emit("start-ark-logs", { serverName: this.containerName, logFileName: logFile });
        }
    }

    switchToContainerLogs(): void {
        if (this.socket?.connected && this.containerName) {
            this.socket.emit("stop-container-logs");
            this.socket.emit("stop-ark-logs");
            this.socket.emit("start-container-logs", { container: this.containerName });
        }
    }

    switchToServerLogs(serverName: string): void {
        if (this.socket?.connected) {
            this.socket.emit("stop-container-logs");
            this.socket.emit("stop-ark-logs");
            this.socket.emit("start-ark-logs", { serverName, logFileName: "shootergame.log" });
        }
    }

    async disconnect(): Promise<void> {
        if (this.socket) {
            try {
                this.socket.emit("stop-container-logs");
                this.socket.emit("stop-ark-logs");
                this.socket.disconnect();
                this.socket = null;
                this.containerName = null;
            } catch (error: unknown) {
                console.error("Error disconnecting socket:", error);
            }
        }
        if ((this as any).mockLogInterval) {
            clearInterval((this as any).mockLogInterval);
            (this as any).mockLogInterval = null;
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.containerName = null;
        this.reconnectAttempts = 0;
    }

    onContainerLog(callback: (data: LogMessage) => void): void {
        if (this.socket) {
            this.socket.on("container-log-data", (data) => {
                const logMessage: LogMessage = {
                    timestamp: data.timestamp,
                    level: "info",
                    message: data.data,
                    container: this.containerName || "unknown",
                };
                callback(logMessage);
            });
        } else {
            console.warn("Socket.IO not available, using mock log updates");
            const mockInterval = setInterval(() => {
                const mockLog: LogMessage = {
                    timestamp: new Date().toISOString(),
                    level: "info",
                    message: `[Mock] Container ${this.containerName} log entry - Socket.IO not available`,
                    container: this.containerName || "unknown",
                };
                callback(mockLog);
            }, 5000);
            (this as any).mockLogInterval = mockInterval;
        }
    }

    onArkLog(callback: (data: LogMessage) => void): void {
        if (this.socket) {
            this.socket.on("ark-log-data", (data) => {
                const logMessage: LogMessage = {
                    timestamp: data.timestamp,
                    level: data.level || "info",
                    message: data.message,
                    container: data.container || this.containerName || "unknown",
                };
                callback(logMessage);
            });
        }
    }

    onServerLog(callback: (data: LogMessage) => void): void {
        this.onArkLog(callback);
    }

    onJobProgress(callback: (data: JobProgress) => void): void {
        if (this.socket) {
            this.socket.on("job-progress", (data) => callback(data));
        }
    }

    offContainerLog(): void { if (this.socket) this.socket.off("container-log-data"); }
    offArkLog(): void { if (this.socket) this.socket.off("ark-log-data"); }
    offServerLog(): void { this.offArkLog(); }
    offJobProgress(): void { if (this.socket) this.socket.off("job-progress"); }

    onConnect(callback: () => void): void { if (this.socket) this.socket.on("connect", callback); }
    onDisconnect(callback: (reason: string) => void): void { if (this.socket) this.socket.on("disconnect", callback); }
    onError(callback: (error: Error) => void): void {
        if (this.socket) {
            this.socket.on("connect_error", callback);
            this.socket.on("error", callback);
        }
    }

    isConnected(): boolean { return this.socket?.connected || false; }
    getCurrentContainer(): string | null { return this.containerName; }

    connectToSystemLogs(): Promise<void> {
        return new Promise((resolve) => {
            if (this.socket?.connected) this.disconnect();
            const socketUrl = this.resolveSocketUrl();
            const token = localStorage.getItem("auth_token");

            this.socket = io(socketUrl, {
                path: "/socket.io/",
                transports: ["websocket", "polling"],
                timeout: 20000,
                forceNew: true,
                withCredentials: true,
                auth: { token: token || "" },
            });

            this.socket.on("connect", async () => {
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                try {
                    if (this.socket) this.socket.emit("start-system-logs");
                    resolve();
                } catch (error: unknown) {
                    console.error("Error in system logs connection setup:", error);
                    resolve();
                }
            });

            this.socket.on("disconnect", (reason: string) => {
                if (reason === "io server disconnect") this.socket = null;
            });

            this.socket.on("connect_error", (error: Error) => {
                console.warn("System logs Socket.IO connection failed, using static logs only:", error);
                resolve();
            });

            this.socket.on("error", (error: Error) => console.error("System logs socket error:", error));

            this.socket.on("disconnect", (reason: string) => {
                if (reason === "io client disconnect") return;
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.connectToSystemLogs().catch(console.error), this.reconnectDelay);
                    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
                }
            });
        });
    }

    onSystemLog(callback: (data: LogMessage) => void): void {
        if (this.socket) {
            this.socket.on("system-log-data", (data) => {
                const logMessage: LogMessage = {
                    timestamp: data.timestamp,
                    level: data.level,
                    message: data.message,
                    container: "system",
                };
                callback(logMessage);
            });
        }
    }

    offSystemLog(): void {
        if (this.socket) {
            this.socket.off("system-log-data");
        }
    }

    emit(event: string, data?: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    onCustomEvent(event: string, callback: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    offCustomEvent(event: string, callback?: (...args: any[]) => void): void {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

export const socketManager = new SocketManager();
export default socketManager;
