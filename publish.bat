@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion

rem NothingSec Git synchronization and publishing script.
rem Purpose: synchronize remote content, commit local changes, and push to GitHub.
rem Usage: local Astro development when Decap CMS may update remote Markdown first.
rem Safety: uses rebase and never runs force push, reset, or automatic deletion.

cd /d "%~dp0"

echo.
echo ========================================
echo   NothingSec Blog Publishing
echo ========================================
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo [ERROR] The current directory is not a Git repository: %CD%
  goto :failed
)

echo [1/6] Pulling the latest content from GitHub...
git pull --rebase --autostash
if errorlevel 1 (
  echo.
  echo [ERROR] git pull --rebase failed.
  echo Run git status, resolve any conflicts, and then run this script again.
  echo The script will not continue to commit or push.
  goto :failed
)

echo.
echo [2/6] Current Git status:
git status
if errorlevel 1 (
  echo.
  echo [ERROR] Unable to read Git status.
  goto :failed
)

echo.
choice /C YN /N /M "Add and publish these changes? [Y/N]: "
if errorlevel 2 (
  echo.
  echo Cancelled. No add, commit, or push was performed.
  goto :success
)

echo.
echo [3/6] Staging changes...
git add .
if errorlevel 1 (
  echo.
  echo [ERROR] git add failed. Review the Git output above.
  goto :failed
)

git diff --cached --quiet
if errorlevel 2 (
  echo.
  echo [ERROR] Unable to inspect the staged changes.
  goto :failed
)
if not errorlevel 1 (
  echo.
  echo [INFO] There are no changes to commit. The script will exit.
  goto :success
)

echo.
echo [4/6] Enter a commit message.
set "message="
set /p "message=Commit message: "
if not defined message (
  echo.
  echo [ERROR] The commit message cannot be empty.
  goto :failed
)

git commit -m "%message%"
if errorlevel 1 (
  echo.
  echo [ERROR] git commit failed. Push was not performed.
  goto :failed
)

echo.
echo [5/6] Pushing to GitHub...
git push
if errorlevel 1 (
  echo.
  echo [ERROR] git push failed.
  echo The local commit was preserved. Resolve the issue above and push again.
  goto :failed
)

echo.
echo [6/6] Publishing completed.
echo GitHub received the latest commit. Cloudflare Pages will deploy automatically.
goto :success

:failed
echo.
echo The operation stopped. No subsequent steps were performed.
pause
exit /b 1

:success
echo.
pause
exit /b 0
