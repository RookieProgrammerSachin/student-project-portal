# Student Project Proposal Portal

A comprehensive web application for students to submit project proposals, with admin review capabilities and AI-powered feedback.

## Features

- **Student Portal**: Submit detailed project proposals with multiple sections
- **Word Count Validation**: Ensure submissions meet length requirements
- **Admin Review**: Administrative interface for reviewing and managing submissions
- **AI Integration**: Automated analysis and feedback on proposals
- **Email Notifications**: Automatic emails with PDF attachments of proposals and feedback

## Tech Stack

- **Frontend**: HTML, CSS (with Tailwind CSS), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **File Handling**: Multer for uploads, PDFKit for PDF generation
- **Email**: Nodemailer for sending notifications
- **AI Integration**: Google Generative AI integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- MySQL database (optional, can use mock data)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/student-proposal-portal.git
   cd student-proposal-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration settings
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the application:
   - Open http://localhost:3000 in your web browser
   - Use admin/password for demo admin login

## Development

### Code Quality Tools

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit linting
- **Jest**: Testing framework

Run these commands:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm run test
```

### Project Structure

```
student-proposal-portal/
├── config/            # Configuration files
├── controllers/       # Route controllers
├── middleware/        # Express middlewares
├── models/            # Database models
├── public/            # Static assets
├── routes/            # API routes
├── services/          # Business logic
├── uploads/           # Uploaded files
├── utils/             # Helper utilities
├── .env               # Environment variables
├── .env.example       # Example environment config
├── .eslintrc.json     # ESLint config
├── Index.html         # Main HTML page
├── package.json       # Dependencies
├── script.js          # Frontend JavaScript
├── server.js          # Express server
└── Style.css          # CSS styles
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- FontAwesome for icons
- Tailwind CSS for styling
- Nodemailer for email functionality