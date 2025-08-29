# Overview

This is a D&D Companion web application that provides essential tools for Dungeons & Dragons gameplay. The application features character management, dice rolling, initiative tracking, spell lookup, and note-taking capabilities. Built as a full-stack application with real-time features, it serves as a comprehensive digital toolkit for both players and dungeon masters during D&D sessions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript and follows a component-based architecture. The application uses:

- **React Router**: Handled by Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with Tailwind CSS for styling, following the shadcn/ui design system
- **Theme System**: Custom theme provider supporting light/dark modes with CSS variables
- **Real-time Communication**: WebSocket integration for live updates during gameplay sessions

The frontend structure separates concerns with dedicated directories for components, pages, hooks, and utilities. The UI follows a responsive design pattern with mobile-first navigation and desktop-optimized layouts.

## Backend Architecture

The backend is an Express.js server using TypeScript with the following architectural decisions:

- **RESTful API**: Express routes handling CRUD operations for characters, sessions, combatants, dice rolls, spells, and notes
- **Real-time Features**: WebSocket server implementation for broadcasting live updates during gameplay
- **Database Layer**: Drizzle ORM for type-safe database operations with PostgreSQL
- **Session Management**: Built-in session handling for multiplayer functionality
- **Middleware**: Custom logging and error handling middleware for API requests

The server implements a storage abstraction layer that defines interfaces for all data operations, making the codebase flexible for different storage backends.

## Data Storage Solutions

The application uses PostgreSQL as the primary database with Drizzle ORM providing:

- **Type Safety**: Full TypeScript integration with compile-time type checking
- **Schema Management**: Declarative schema definitions with automatic migrations
- **Query Builder**: Type-safe query construction and execution
- **Connection Handling**: Neon serverless PostgreSQL integration for scalable database connections

The database schema includes tables for characters, sessions, combatants, dice rolls, spells, and notes, with proper relationships and constraints.

## Build and Development Tools

- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full type safety across frontend and backend with shared type definitions
- **Development**: Hot module replacement and error overlay for rapid development
- **Production**: ESBuild for server bundling and Vite for client optimization

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit and query builder

## UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives for building the component library
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library providing consistent iconography
- **Google Fonts**: External font loading for custom typography (Cinzel Decorative, Inter, JetBrains Mono)

## State Management and Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema parsing

## Development and Build Tools
- **Vite**: Build tool and development server with Replit integration
- **PostCSS**: CSS processing for Tailwind CSS compilation
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds

## Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time game updates
- **Custom WebSocket Hook**: React integration for handling live gameplay events

## Utilities and Helpers
- **date-fns**: Date manipulation and formatting utilities
- **clsx & tailwind-merge**: Conditional class name utilities for dynamic styling
- **nanoid**: Unique ID generation for various application entities