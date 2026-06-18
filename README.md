# QuickCorpID - Hong Kong Business Identity Made Simple

A bilingual (English/Chinese) freemium SaaS platform for Hong Kong businesses to obtain their CorpID digital identity through a streamlined onboarding process.

## Features

- **4-Step Registration Wizard** - Streamlined CorpID application process
- **Bilingual Support** - Full English and Traditional Chinese interface
- **Real-time Status Tracking** - Monitor application progress
- **Document Management** - Upload and manage identity documents
- **Mobile Responsive** - Works seamlessly on all devices
- **Secure Authentication** - AWS Cognito email/password auth

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Backend**: AWS (Cognito, S3, optional API Gateway + Lambda + DynamoDB)
- **i18n**: Custom LanguageContext

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- AWS Account with Cognito User Pool configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/wisdomlinkai/QuickCorpID.git
cd QuickCorpID
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your AWS credentials:
```
VITE_AWS_REGION=ap-east-1
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_S3_BUCKET=your-bucket-name
```

4. Start development server:
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## AWS Setup

### 1. Create Cognito User Pool

1. Go to AWS Cognito console
2. Create a new User Pool
3. Enable email sign-in
4. Create an App Client (no secret key for frontend)
5. Note the User Pool ID and App Client ID

### 2. Create S3 Bucket (Optional)

1. Go to AWS S3 console
2. Create a bucket for document uploads
3. Configure CORS for your domain
4. Note the bucket name

### 3. Configure IAM (Optional for S3)

Create an Identity Pool if you need S3 access, or use API Gateway + Lambda for backend operations.

## Project Structure

```
QuickCorpID/
├── src/
│   ├── components/          # Reusable UI components
│   ├── config/              # Configuration files
│   │   └── branding.tsx     # Co-branding system
│   ├── i18n/                # Internationalization
│   ├── lib/                 # Core libraries
│   │   ├── AuthContext.tsx  # Authentication provider
│   │   └── aws.ts           # AWS client & helpers
│   ├── pages/               # Page components
│   ├── services/            # API services
│   │   └── corpidApi.ts     # CorpID Sandbox API mock
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── .env.example             # Environment template
├── .netlify.toml            # Netlify config
├── vercel.json              # Vercel config
├── vite.config.ts           # Vite config
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |

## Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### AWS Amplify Hosting

1. Connect your repository in AWS Amplify Console
2. Configure build settings (already set in amplify.yml)
3. Set environment variables
4. Deploy

## CorpID Integration

This project includes a mock CorpID Sandbox API (`src/services/corpidApi.ts`). To integrate with the real CorpID Sandbox:

1. Register at https://sb.corpid.gov.hk/
2. Obtain API credentials
3. Replace mock functions with real API calls

## Co-Branding System

The project supports white-label customization:

```typescript
// src/config/branding.tsx
const customBranding = {
  name: 'Your Brand',
  tagline: 'Your Tagline',
  logo: '/your-logo.svg',
  primaryColor: '#your-color',
};
```

## Local Development without AWS

The app includes localStorage fallbacks for all AWS services, so you can develop and test without configuring AWS:

- User profiles stored in localStorage
- Applications stored in localStorage
- Documents stored as base64 in localStorage

This allows full functionality testing locally.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and open a Pull Request

## License

MIT License
