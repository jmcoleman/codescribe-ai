Perfect! Here’s a **fully self-contained Markdown file** for Codescribe that includes **everything**: setup instructions, `.gitignore` guidance, workflow, references, and a **ready-to-run one-command setup script** embedded. Contributors can copy-paste and run it directly.

You can save this as `SECURITY-GIT-SECRETS.md`.

````markdown
# Codescribe Git Secret Scanning Guide

This guide explains how to set up **pre-commit secret scanning** for Codescribe repositories.  
It prevents API keys, `.env` files, and other sensitive data from being accidentally committed or pushed to GitHub.

---

## 1. Install `git-secrets`

`git-secrets` scans commits and blocks secrets before they reach GitHub.

### macOS

```bash
brew install git-secrets
````

### Linux

Follow instructions here: [git-secrets GitHub](https://github.com/awslabs/git-secrets)

---

## 2. Recommended `.gitignore` rules

Prevent accidental commits of environment files and backups:

```gitignore
# Environment files
server/.env*
*.env.bak*
```

> Make sure this is committed to the repo so all contributors inherit it.

---

## 3. One-Command Codescribe Setup

This single command sets up `git-secrets`, registers AWS defaults, and adds Codescribe-specific patterns for Stripe and Anthropic keys.

```bash
#!/bin/bash

# Codescribe One-Command Git Secret Scan Setup
# Run this in the root of your Codescribe repo after cloning.

# 1️⃣ Install git-secrets if missing (macOS example)
if ! command -v git-secrets &> /dev/null; then
    echo "git-secrets not found. Installing..."
    brew install git-secrets
fi

# 2️⃣ Initialize git-secrets in this repo
echo "Initializing git-secrets pre-commit hook..."
git secrets --install
git secrets --register-aws

# 3️⃣ Add Codescribe-specific secret patterns
echo "Adding Codescribe-specific secret patterns..."
git secrets --add 'sk_live_[A-Za-z0-9]{24}'      # Stripe live keys
git secrets --add 'sk_test_[A-Za-z0-9]{24}'      # Stripe test keys
git secrets --add 'anthropic_[A-Za-z0-9]{32}'    # Anthropic API keys

# 4️⃣ Confirm setup
echo "Setup complete. Testing git-secrets..."
git secrets --scan
echo "git-secrets is now active. Commits containing secrets will be blocked."
```

### Usage

1. Save this script as `setup-git-secrets.sh` in the root of the repo.
2. Make it executable:

```bash
chmod +x setup-git-secrets.sh
```

3. Run it:

```bash
./setup-git-secrets.sh
```

After this, `git-secrets` is active, and any commit containing matching secrets will be blocked.

---

## 4. Workflow Summary

1. Ensure `git-secrets` is installed and initialized.
2. Keep `.gitignore` up to date.
3. Attempted commits containing secrets will be blocked.
4. If a secret is accidentally committed:

   * Remove it from history using `git filter-repo`.
   * Rotate the key immediately in its respective dashboard (e.g., Stripe, Anthropic).

---

## 5. Force-Push after Removing Secrets

If you remove secrets from history:

```bash
git push origin main --force
```

> Only do this if you are aware of history rewriting implications.
> Use `--force-with-lease` if multiple collaborators exist.

---

## 6. References

* GitHub secret scanning: [https://docs.github.com/code-security/secret-scanning](https://docs.github.com/code-security/secret-scanning)
* git-secrets repository: [https://github.com/awslabs/git-secrets](https://github.com/awslabs/git-secrets)
* GitHub push protection guide: [https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection](https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection)

---

## 7. Notes

* Always rotate keys if they were ever committed, even in a test branch.
* Educate all contributors to follow this process for secure Git practices.
* New contributors can copy-paste the **one-command setup script** to configure secret scanning immediately after cloning the repo.

```

---

This version is fully **copy-paste ready** — contributors just save the Markdown, grab the embedded script, and run it to be fully protected.  

If you want, I can also create a **separate `setup-git-secrets.sh` file** that is included in the repo so the Markdown just references it, making it even simpler for new developers.  

Do you want me to do that too?
```
