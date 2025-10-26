# destructive-clean-push.ps1
# WARNING: Destructive operations. Read comments before running.
#
# What this does:
# - Copies your current working tree to a clean folder (excluding .git)
# - Initializes a new git repo, makes a single commit with the provided author
# - Force-pushes that commit to https://github.com/akhilesh-reddy2005/campusbus.git (replaces remote history)
# - Deletes all remote branches except 'main'
# - Deletes all remote tags
# - Removes collaborators via GitHub CLI (keeps owner and the authenticated user)
#
# Requirements:
# - git installed and on PATH
# - gh (GitHub CLI) installed and authenticated (for collaborator removal)
# - You must be repository admin and able to force-push or temporarily disable branch protection

# -------- CONFIG (you can change these paths if needed) --------
$sourcePath = "C:\Users\akhil\OneDrive\Desktop\buss-pass_final"
$cleanCopyPath = "C:\Users\akhil\OneDrive\Desktop\campusbus-clean"
$remoteUrl = "https://github.com/akhilesh-reddy2005/campusbus.git"
$protectedBranches = @('main')  # branches to keep

# Author info (filled from your input)
$commitAuthorName = "akhilesh reddy"
$commitAuthorEmail = "akhileshreddy1246@gmail.com"

# Safety confirmation (user must type EXACTLY YES)
Write-Host ""
Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
Write-Host "DANGEROUS: This script will REPLACE the remote repository history at $remoteUrl" -ForegroundColor Red
Write-Host "and DELETE remote branches/tags and remove collaborators. This cannot be undone." -ForegroundColor Red
Write-Host "If you are absolutely sure, type EXACTLY: YES" -ForegroundColor Yellow
$confirm = Read-Host "Type YES to proceed"
if ($confirm -ne "YES") {
  Write-Host "Aborted by user. No changes made." -ForegroundColor Green
  exit 1
}

# Prepare clean workspace
if (Test-Path $cleanCopyPath) {
  Write-Host "Removing existing clean copy at $cleanCopyPath" -ForegroundColor Yellow
  Remove-Item -Recurse -Force $cleanCopyPath
}

Write-Host "Creating clean copy directory $cleanCopyPath ..."
New-Item -ItemType Directory -Path $cleanCopyPath | Out-Null

Write-Host "Copying files from $sourcePath to $cleanCopyPath (excluding .git) ..."
robocopy $sourcePath $cleanCopyPath /MIR /XD ".git" | Out-Null

# Initialize git and make single commit
Set-Location $cleanCopyPath
git init
git checkout -b main

# Configure commit author locally
git config user.name "$commitAuthorName"
git config user.email "$commitAuthorEmail"

Write-Host "Creating single initial commit..."
git add --all
# The commit may fail if nothing changed; we will allow it to continue but will check
$commitResult = git commit -m "Initial clean commit — fresh repository content" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Git commit failed or returned non-zero exit code: $commitResult" -ForegroundColor Yellow
  Write-Host "This might happen if there are no files to commit. Aborting." -ForegroundColor Red
  exit 1
}

# Add remote and force-push
git remote add origin $remoteUrl

Write-Host "About to force-push local 'main' to remote 'origin/main' (this will replace remote history)..." -ForegroundColor Red
Write-Host "If the remote has branch protection for 'main', this push will fail. Disable protection or update the script to push to a new branch and set it default in GitHub." -ForegroundColor Yellow
git push --force --set-upstream origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed. Check branch protection or remote permissions. Aborting further destructive steps." -ForegroundColor Red
  exit 1
}

# Delete other remote branches
Write-Host "Deleting remote branches from origin except: $($protectedBranches -join ', ')" -ForegroundColor Yellow
git fetch origin --prune

# Enumerate remote branches and delete those not in protected list
$remoteBranches = git for-each-ref --format='%(refname:short)' refs/remotes/origin
foreach ($r in $remoteBranches) {
  $b = $r -replace '^origin/',''
  if ($protectedBranches -notcontains $b) {
    Write-Host "Deleting remote branch origin/$b ..."
    git push origin --delete $b
  } else {
    Write-Host "Keeping protected branch origin/$b"
  }
}

# Delete all remote tags
Write-Host "Deleting all remote tags ..."
$tags = git ls-remote --tags origin | ForEach-Object {
  ($_ -split "`t")[1] -replace 'refs/tags/',''
} | Where-Object { $_ -ne '' } 
foreach ($t in $tags) {
  Write-Host "Deleting remote tag $t"
  git push origin --delete tag $t
}

# Remove collaborators using gh (GitHub CLI)
Write-Host ""
Write-Host "Removing collaborators via GitHub CLI (gh)..." -ForegroundColor Yellow
# Check gh presence
$ghExists = (Get-Command gh -ErrorAction SilentlyContinue) -ne $null
if (-not $ghExists) {
  Write-Host "gh (GitHub CLI) is not installed or not on PATH. Skipping collaborator removal." -ForegroundColor Yellow
} else {
  # Get authenticated user
  try {
    $authUser = gh api user --jq '.login' 2>$null
    if (-not $authUser) { throw 'not authenticated' }
    $authUser = $authUser.Trim()
    Write-Host "Authenticated as: $authUser"
  } catch {
    Write-Host "Failed to determine authenticated gh user. Ensure you ran 'gh auth login' with a user that has admin rights. Skipping collaborator removal." -ForegroundColor Yellow
    $authUser = $null
  }

  if ($authUser) {
    # List collaborators
    try {
      $collabsRaw = gh api repos/akhilesh-reddy2005/campusbus/collaborators --jq '.[].login' 2>$null
      if (-not $collabsRaw) {
        Write-Host "No collaborators found or failed to list collaborators. Skipping removal." -ForegroundColor Yellow
      } else {
        $collabs = $collabsRaw -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
        Write-Host "Found collaborators: $($collabs -join ', ')"
        foreach ($user in $collabs) {
          # skip removing the repo owner or the authenticated user to avoid locking yourself out
          if ($user -eq 'akhilesh-reddy2005' -or $user -eq $authUser) {
            Write-Host "Skipping removal of $user (owner or authenticated user)"
            continue
          }
          Write-Host "Removing collaborator $user ..."
          gh api -X DELETE /repos/akhilesh-reddy2005/campusbus/collaborators/$user
          if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to remove $user (continued) - check permissions or run manually." -ForegroundColor Yellow
          } else {
            Write-Host "Removed $user"
          }
        }
      }
    } catch {
      Write-Host "Error while listing/removing collaborators: $_" -ForegroundColor Yellow
    }
  }
}

Write-Host ""
Write-Host "Finished destructive operations. Verify repository at: $remoteUrl" -ForegroundColor Green
Write-Host "Reminder: Re-enable branch protection on 'main' and re-invite any necessary collaborators." -ForegroundColor Yellow
