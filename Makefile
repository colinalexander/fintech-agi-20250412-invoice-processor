.PHONY: run-backend run-frontend run stop lint lint-fix clean install install-backend install-frontend

# Default Python interpreter
PYTHON = uv run python

# Run the backend server
run-backend:
	cd backend && $(PYTHON) run.py

# Run the frontend development server
run-frontend:
	cd frontend && npm run dev

# Run both frontend and backend (in separate terminals)
run:
	@echo "Please run 'make run-backend' and 'make run-frontend' in separate terminals"

# Run linting checks
lint:
	$(PYTHON) -m ruff check .
	cd frontend && npm run lint

# Fix lint errors automatically
lint-fix:
	$(PYTHON) -m ruff check --fix .
	$(PYTHON) -m ruff format .

# Install backend dependencies
install-backend:
	uv pip install -e .

# Install frontend dependencies
install-frontend:
	cd frontend && npm install

# Install all dependencies
install: install-backend install-frontend

# Clean up cache files
clean:
	rm -rf .pytest_cache
	rm -rf __pycache__
	rm -rf **/__pycache__
	rm -rf .ruff_cache
	rm -rf frontend/.next

# Stop running servers
stop:
	@echo "Stopping any running frontend and backend servers..."
	-lsof -ti :3000 | xargs kill -9 2>/dev/null || true
	-lsof -ti :8081 | xargs kill -9 2>/dev/null || true
	@echo "Servers stopped successfully."

