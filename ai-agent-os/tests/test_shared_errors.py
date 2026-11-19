"""Unit tests for shared/errors module."""

import unittest
import sys
from pathlib import Path

# Add scratch root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from shared.errors import (
    StateCode,
    StateLevel,
    ErrorCode,
    ErrorSeverity,
    ErrorCategory,
    ERROR_METADATA,
    AIOSException,
    InputException,
    AgentException,
    LockException,
    GitException,
    ReviewException,
    ContextException,
    CacheException,
    SystemException,
)


class TestSharedErrors(unittest.TestCase):

    def test_state_codes_and_recovery(self):
        self.assertEqual(StateCode.OK, "OK")
        self.assertTrue(StateCode.TIMEOUT.is_auto_recoverable)
        self.assertTrue(StateCode.FORCE_UNLOCK.is_auto_recoverable)
        self.assertTrue(StateCode.CACHE_INVALID.is_auto_recoverable)
        self.assertFalse(StateCode.NG.is_auto_recoverable)
        self.assertFalse(StateCode.CONFLICT_DETECTED.is_auto_recoverable)

        self.assertTrue(StateCode.DECISION_REQUIRED.requires_human_decision)
        self.assertTrue(StateCode.BLOCK.requires_human_decision)
        self.assertFalse(StateCode.OK.requires_human_decision)

    def test_error_code_metadata(self):
        meta = ErrorCode.E2002_AGENT_TIMEOUT.meta
        self.assertEqual(meta.code, "E2002")
        self.assertEqual(meta.category, ErrorCategory.AGENT)
        self.assertEqual(meta.severity, ErrorSeverity.SEVERITY_2)
        self.assertEqual(meta.result_state, "TIMEOUT")

        meta_git = ErrorCode.E4002_CONFLICT_DETECTED.meta
        self.assertEqual(meta_git.code, "E4002")
        self.assertEqual(meta_git.category, ErrorCategory.GIT)
        self.assertEqual(meta_git.result_state, "CONFLICT_DETECTED")

    def test_all_error_codes_have_metadata(self):
        for code in ErrorCode:
            self.assertIn(code, ERROR_METADATA)
            meta = code.meta
            self.assertIsNotNone(meta.code)
            self.assertIsNotNone(meta.description)
            self.assertIsNotNone(meta.recovery_action)
            self.assertIsNotNone(meta.result_state)

    def test_aios_exception_to_audit_log(self):
        exc = AIOSException(
            error_code=ErrorCode.E3001_LOCK_ACQUIRE_FAILED,
            message="Lock acquisition timed out",
            execution_id="EXEC-000100",
            instruction_id="INST-000050",
            details={"resource": "file.py"},
        )
        self.assertEqual(exc.result_state, StateCode.BLOCK)

        log_dict = exc.to_audit_log_dict()
        self.assertEqual(log_dict["eventType"], "ERROR")
        self.assertEqual(log_dict["errorCode"], "E3001")
        self.assertEqual(log_dict["errorName"], "LOCK_ACQUIRE_FAILED")
        self.assertEqual(log_dict["severity"], "HIGH")
        self.assertEqual(log_dict["resultState"], "BLOCK")
        self.assertEqual(log_dict["executionId"], "EXEC-000100")
        self.assertEqual(log_dict["instructionId"], "INST-000050")
        self.assertEqual(log_dict["details"]["resource"], "file.py")

    def test_subclass_exceptions(self):
        input_exc = InputException(message="Invalid format")
        self.assertEqual(input_exc.error_code, ErrorCode.E1002_INVALID_PARAMETER)
        self.assertEqual(input_exc.result_state, StateCode.BLOCK)

        git_exc = GitException(error_code=ErrorCode.E4002_CONFLICT_DETECTED)
        self.assertEqual(git_exc.result_state, StateCode.CONFLICT_DETECTED)

        ctx_exc = ContextException(error_code=ErrorCode.E6001_CONTEXT_LIMIT_EXCEEDED)
        self.assertEqual(ctx_exc.result_state, StateCode.SPLIT_REQUIRED)

        sys_exc = SystemException(error_code=ErrorCode.E9001_UNKNOWN_ERROR)
        self.assertEqual(sys_exc.result_state, StateCode.NG)


if __name__ == "__main__":
    unittest.main()
