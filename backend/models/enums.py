from enum import Enum


class SessionStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


class VerdictEnum(str, Enum):
    CHEATING = "CHEATING"
    OK = "OK"
