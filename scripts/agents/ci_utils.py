"""GitHub Actions 로깅 유틸리티.

CI 환경에서만 어노테이션(::error::, ::warning::, ::group::)을 출력하고,
로컬 실행 시에는 기존 print 로그만 유지한다.
"""

import os

_IS_CI = os.environ.get("CI") == "true"
_SUMMARY_PATH = os.environ.get("GITHUB_STEP_SUMMARY", "")

# 경고/에러 수집 (Job Summary에서 사용)
_warnings: list[str] = []
_errors: list[str] = []


def ci_warning(msg: str):
    """GitHub Actions warning 어노테이션 + 일반 로그."""
    if _IS_CI:
        print(f"::warning::{msg}")
    print(f"[WARN] {msg}")
    _warnings.append(msg)


def ci_error(msg: str):
    """GitHub Actions error 어노테이션 + 일반 로그."""
    if _IS_CI:
        print(f"::error::{msg}")
    print(f"[ERROR] {msg}")
    _errors.append(msg)


def ci_group(title: str):
    """GitHub Actions 접을 수 있는 섹션 시작."""
    if _IS_CI:
        print(f"::group::{title}")


def ci_endgroup():
    """GitHub Actions 접을 수 있는 섹션 종료."""
    if _IS_CI:
        print("::endgroup::")


def get_collected_warnings() -> list[str]:
    return list(_warnings)


def get_collected_errors() -> list[str]:
    return list(_errors)


def reset_collected():
    """수집된 경고/에러 초기화 (파이프라인 시작 시 호출)."""
    _warnings.clear()
    _errors.clear()


def write_job_summary(markdown: str):
    """$GITHUB_STEP_SUMMARY에 마크다운 작성."""
    if not _IS_CI or not _SUMMARY_PATH:
        return
    try:
        with open(_SUMMARY_PATH, "a", encoding="utf-8") as f:
            f.write(markdown + "\n")
    except Exception as e:
        print(f"[WARN] Job Summary 작성 실패: {e}")
