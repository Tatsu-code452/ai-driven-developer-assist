"""Unit tests for shared/models module."""

import unittest
import sys
from pathlib import Path

# Add scratch root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from shared.models import (
    BaseEntity,
    Instruction,
    InstructionPriority,
    InstructionStatus,
    Execution,
    ExecutionStatus,
    Review,
    ReviewResult,
    Decision,
    Trace,
    Lock,
    LockStatus,
    Cache,
    CacheStatus,
    AuditLog,
    AuditEventType,
)


class TestSharedModels(unittest.TestCase):

    def test_instruction_model(self):
        inst = Instruction(
            instructionId="INST-000001",
            title="Implement Shared Models",
            priority=InstructionPriority.HIGH,
        )
        self.assertEqual(inst.status, InstructionStatus.OPEN)
        inst.assign()
        self.assertEqual(inst.status, InstructionStatus.ASSIGNED)
        inst.start()
        self.assertEqual(inst.status, InstructionStatus.IN_PROGRESS)
        inst.complete()
        self.assertEqual(inst.status, InstructionStatus.COMPLETED)

    def test_execution_model(self):
        exec_model = Execution(
            executionId="EXEC-000001",
            instructionId="INST-000001",
        )
        self.assertEqual(exec_model.status, ExecutionStatus.READY)
        exec_model.start("Developer-Agent")
        self.assertEqual(exec_model.status, ExecutionStatus.WORKING)
        self.assertEqual(exec_model.assignedAgent, "Developer-Agent")
        exec_model.complete()
        self.assertEqual(exec_model.status, ExecutionStatus.COMPLETED)
        self.assertIsNotNone(exec_model.completedAt)

    def test_review_model(self):
        rev = Review(
            reviewId="REV-000001",
            executionId="EXEC-000001",
            reviewer="Reviewer-Agent",
            result=ReviewResult.OK,
            comment="Approved",
        )
        self.assertEqual(rev.result, ReviewResult.OK)

    def test_decision_model(self):
        dec = Decision(
            decisionId="DECISION-000001",
            traceId="TRACE-000001",
            decisionMaker="PM-Agent",
            decision="APPROVED",
            reason="Meets requirements",
        )
        self.assertEqual(dec.decisionMaker, "PM-Agent")

    def test_trace_model(self):
        tr = Trace(
            traceId="TRACE-000001",
            instructionId="INST-000001",
            executionId="EXEC-000001",
        )
        self.assertEqual(tr.traceId, "TRACE-000001")

    def test_lock_model(self):
        lock = Lock(
            lockId="LOCK-000001",
            resource="shared/models/base.py",
            ownerAgent="Developer-Agent",
            expireAt="2026-11-19T06:00:00Z",
        )
        self.assertEqual(lock.status, LockStatus.ACTIVE)
        lock.release()
        self.assertEqual(lock.status, LockStatus.RELEASED)

    def test_cache_model(self):
        cache = Cache(
            cacheId="CACHE-000001",
            targetId="INST-000001",
            hash="abc123hash",
            expireAt="2026-11-20T05:00:00Z",
        )
        self.assertEqual(cache.status, CacheStatus.VALID)
        cache.invalidate()
        self.assertEqual(cache.status, CacheStatus.INVALID)

    def test_audit_log_model(self):
        log = AuditLog(
            eventId="EVT-000001",
            eventType=AuditEventType.CREATE,
            resource="shared/models",
            actor="Developer-Agent",
        )
        self.assertEqual(log.eventType, AuditEventType.CREATE)


if __name__ == "__main__":
    unittest.main()
