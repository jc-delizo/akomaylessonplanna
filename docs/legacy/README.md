# Legacy Documentation

This folder contains **outdated documentation** that has been superseded by newer guides. These files are kept for historical reference only.

---

## Why These Files Are Here

These documents describe old workflows or architectures that are no longer current:

### ❌ VERCEL-SETUP-GUIDE.md
**Status**: Outdated - Describes single Vercel project setup  
**Superseded By**: [DEV-PROD-SETUP-GUIDE.md](../implementationplan/DEV-PROD-SETUP-GUIDE.md)  
**Reason**: We now use isolated dev/prod environments with two separate Vercel projects and branch-based deployment workflow (dev/main branches).

---

### ❌ DEPLOYMENT-ARCHITECTURE.md
**Status**: Outdated - Describes single-environment architecture  
**Superseded By**: [DEV-PROD-SETUP-GUIDE.md](../implementationplan/DEV-PROD-SETUP-GUIDE.md)  
**Reason**: The architecture has been updated to support isolated dev/prod environments with separate databases and deployment targets.

---

### ❌ PRODUCTION-MIGRATION-GUIDE.md
**Status**: Redundant - Superseded by comprehensive guides  
**Superseded By**: 
- [DEPLOYMENT-WORKFLOW.md](../implementationplan/DEPLOYMENT-WORKFLOW.md) - For migration workflow
- [DATABASE-MIGRATIONS-INDEX.md](../DATABASE-MIGRATIONS-INDEX.md) - For migration details  

**Reason**: The migration workflow is now comprehensively covered in DEPLOYMENT-WORKFLOW.md (includes dev/prod workflow), and DATABASE-MIGRATIONS-INDEX.md provides complete migration documentation. This standalone guide was redundant.

---

### ❌ scripts/README-migration-008.md
**Status**: Outdated - Only covered 1 of 18 migrations  
**Superseded By**: [DATABASE-MIGRATIONS-INDEX.md](../DATABASE-MIGRATIONS-INDEX.md)  
**Reason**: This file only documented migration 008. The new DATABASE-MIGRATIONS-INDEX.md provides comprehensive documentation for all 18 migrations with dependencies, purposes, and verification commands.

---

## Current Documentation

For up-to-date setup and deployment instructions, see:

- **[DEV-PROD-SETUP-GUIDE.md](../implementationplan/DEV-PROD-SETUP-GUIDE.md)** - Master guide for dev/prod isolated setup
- **[CONFIGURATION-SETUP.md](../implementationplan/CONFIGURATION-SETUP.md)** - Two Vercel projects configuration
- **[DEPLOYMENT-WORKFLOW.md](../implementationplan/DEPLOYMENT-WORKFLOW.md)** - Branch-based workflow (dev/main)
- **[ENVIRONMENT-VARIABLES.md](../implementationplan/ENVIRONMENT-VARIABLES.md)** - Environment variables for all three environments

---

## When to Use Legacy Docs

⚠️ **DO NOT** use these files for new setups or configurations.

✅ **Only reference** these files if you need to understand:
- Historical context for why changes were made
- Old architecture for migration purposes
- Previous setup approaches

---

**Last Updated**: January 25, 2026
