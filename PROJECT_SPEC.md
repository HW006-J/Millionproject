ONE MILLION — Full Project Specification
I want you to build a complete mobile-first web application/PWA called “ONE MILLION.”
PRODUCT CONCEPT
ONE MILLION is a deliberately minimal viral social experiment.
The entire objective is to see whether people on the internet will collectively contribute $1,000,000 simply because the goal exists.
There is:
* No emotional story
* No charitable cause
* No promised investment return
* No product being purchased
* No reward for contributing
* No ownership or equity
* No complicated explanation
The appeal is momentum, curiosity, internet culture, and being part of something absurd.
The central message should be:
“$1,000,000. Can the internet do it?”
Supporting copy:
“No cause. No reward. No explanation. Just one ridiculous goal.”
Do not describe the project as a registered charity.
Use the word “contribute” rather than “donate” throughout the product until the legal and payment structure has been reviewed.

TECH STACK
Build it using:
* Next.js with App Router
* TypeScript
* Tailwind CSS
* PostgreSQL
* Prisma ORM
* Stripe Checkout in test mode
* Stripe webhooks
* Vercel-compatible deployment
* Progressive Web App support
* Vitest or Jest for essential tests
Use the latest stable versions that are compatible with one another.
The application must run locally with:
npm install
npm run dev
Create a detailed README explaining setup.

CURRENCY
Use USD throughout the entire application.
Display all monetary values using the dollar symbol:
$
Store all monetary values internally as integer cents.
Examples:
* $1.00 = 100 cents
* $10.00 = 1000 cents
* $1,000,000.00 = 100000000 cents
Never use floating-point numbers to store or calculate money.
Use Stripe currency:
usd
All database fields, validation functions, API responses, calculations, tests, and documentation must use cents rather than pence.

DESIGN DIRECTION
The app should feel:
* Bold
* Slightly insane
* Internet-native
* Premium
* Extremely minimal
* Fast
* Addictive
* Built around momentum
Use:
* A black or off-white background
* Huge typography
* A giant animated total
* One strong accent color
* Smooth number animations
* Subtle grain or texture
* Responsive design
* Confetti after successful contributions
* No stock photographs
* No emotional imagery
* No cluttered navigation
Do not make it look like a traditional charity website.
The experience should feel like a combination of:
* A live internet counter
* A world-record attempt
* A social experiment
* A viral movement

PRIMARY PAGE
Create one main landing page.
The first viewport should contain:
1. Small logo:
ONE MILLION
1. Huge live amount:
$143,728.42
1. Target underneath:
raised of $1,000,000
1. Animated progress bar
2. Percentage completed
3. Main copy:
Can the internet do it?
1. Supporting copy:
No cause. No reward. No explanation.
Just one ridiculous goal.
1. Contribution amount buttons:
$1
$5
$10
$25
$100
Custom
1. Large CTA:
ADD TO THE MILLION
1. Momentum information:
* Number of contributors
* Amount raised today
* Amount raised in the last hour
* Average contribution
* Distance remaining
The payment process should require as few clicks as possible.

PAYMENT FLOW
When a user selects an amount:
1. Validate the amount on the server.
2. Minimum contribution: $1.
3. Maximum initial contribution: $10,000.
4. Create a Stripe Checkout Session on the server.
5. Set the Stripe Checkout currency to usd.
6. Redirect the user to Stripe-hosted Checkout.
7. Never collect or store card information directly.
8. Redirect successful users to /success.
9. Confirm payment using a verified Stripe webhook.
10. Only add the contribution to the public total after the webhook confirms successful payment.
11. Never trust an amount or payment status sent from the browser.
Store all contribution amounts as integer cents.
Create a payment-provider interface so Stripe could later be replaced with another approved provider.
Include a development environment variable:
PAYMENTS_MODE=mock
When mock mode is enabled:
* Do not contact Stripe.
* Allow developers to simulate successful payments.
* Clearly show “TEST MODE” in the admin area.
* Never expose mock controls publicly in production.

SUCCESS PAGE
After payment, show:
YOU MOVED THE NUMBER.
Then show:
* Contribution amount
* Updated total
* Contributor number
* Percentage of $1 million reached
* Animated confetti
* Share buttons
* Copy-link button
Generate share copy similar to:
I just moved the internet closer to $1,000,000.
No cause. No reward. Just the goal.
[URL]
Allow users to generate a share card containing:
* ONE MILLION logo
* Their contribution amount, optionally hidden
* Current total
* Contributor number
* QR code or URL
Do not expose their email address or payment information.

MOMENTUM FEATURES
Create the following:
1. Live total
Update periodically without requiring a refresh.
2. Recent activity feed
Examples:
Anonymous added $5
Henry added $10
Anonymous moved the number by $1
3. Milestones
* $1,000
* $10,000
* $25,000
* $50,000
* $100,000
* $250,000
* $500,000
* $750,000
* $900,000
* $1,000,000
4. Momentum indicator
Examples:
$842 added in the last hour
127 people joined today
Moving 18% faster than yesterday
5. Countdown remaining
Example:
$856,271.58 TO GO
6. Optional contributor name
Users can choose:
* Anonymous
* First name
* Custom public display name
Public display names must be:
* Trimmed
* Length-limited
* Sanitized
* Checked against a basic profanity filter
Do not require users to create accounts.

SOCIAL PROOF
Below the payment area, display:
* Total contributors
* Recent contributions
* Largest contribution today
* Most common contribution
* Current contribution velocity
* Latest milestone reached
Do not fake activity.
If there are no real contributions, show an honest empty state.
Do not add artificial transactions, fake names, fake countdowns, or misleading urgency.

DATABASE
Create the following Prisma models.
Campaign
* id
* name
* slug
* targetAmountCents
* confirmedAmountCents
* confirmedContributionCount
* createdAt
* updatedAt
* isActive
Contribution
* id
* campaignId
* amountCents
* currency
* paymentProvider
* providerSessionId
* providerPaymentId
* paymentStatus
* publicName
* isAnonymous
* emailHash, nullable
* createdAt
* confirmedAt
* refundedAt
* metadata JSON
WebhookEvent
* id
* provider
* providerEventId, unique
* eventType
* processed
* receivedAt
* processedAt
* failureReason
Milestone
* id
* campaignId
* amountCents
* reachedAt
* announcementPublished
AdminUser
* id
* email
* passwordHash or authentication-provider ID
* createdAt
* lastLoginAt
Use proper indexes and unique constraints.
Prevent duplicate webhook processing using providerEventId.
Do not calculate the public total by trusting a value stored in the browser.
The campaign currency should be stored as or treated as:
USD

API ROUTES
Create secure server routes for the following.
POST /api/checkout
* Validate the selected amount.
* Validate the public display name.
* Convert and store the amount as integer cents.
* Enforce the minimum of 100 cents.
* Enforce the maximum of 1,000,000 cents.
* Create a pending Contribution.
* Create a payment session using USD.
* Return the checkout URL.
POST /api/webhooks/stripe
* Verify the webhook signature.
* Reject invalid signatures.
* Handle checkout.session.completed.
* Handle payment_intent.payment_failed.
* Handle charge.refunded.
* Process each Stripe event only once.
* Update contribution status.
* Recalculate or transactionally update totals.
* Ensure the Stripe payment currency is USD.
* Reject or flag unexpected currencies.
GET /api/campaign
Return safe public campaign statistics.
All monetary values returned by the API should use integer cents unless a specifically formatted display string is also provided.
GET /api/activity
Return recent confirmed public activity.
Never expose:
* Email addresses
* Provider session IDs
* Provider payment IDs
* Private metadata
GET /api/share/[contributionId]
Return only safe public share information.

ADMIN AREA
Create a protected /admin area.
The admin dashboard should show:
* Confirmed amount
* Pending amount
* Refunded amount
* Failed payments
* Contribution count
* Contributions today
* Contributions this week
* Recent webhook failures
* Hourly contribution charts
* Daily contribution charts
* CSV export
* Ability to hide an inappropriate public name
* Ability to pause new contributions
* Ability to edit the campaign target
* Payment mode status
* Stripe connection status
* Campaign currency status
Display all financial values in US dollars.
Do not allow an administrator to manually mark an unpaid contribution as paid.

AUTHENTICATION
Only administrators need accounts.
Use secure authentication with:
* Password hashing
* Secure cookies
* CSRF protection where relevant
* Rate limiting
* Brute-force protection
* Environment-based admin creation
Do not include public user registration.

LEGAL AND TRANSPARENCY PAGES
Create:
* /about
* /terms
* /privacy
* /refunds
Keep /about deliberately short:
ONE MILLION is a social experiment with one objective:
collectively move this number to $1,000,000.
Clearly state:
* This is not a registered charity.
* Contributions are not charitable donations.
* Contributions are not eligible for Gift Aid or any charitable tax deduction.
* Contributors receive no ownership, equity, or investment return.
* No goods or services are promised in exchange.
* Funds are paid to [LEGAL NAME / ENTITY].
* Explain truthfully how the recipient may use the funds.
* Payments are processed by the selected payment provider.
* The public total represents confirmed payments, less refunds where applicable.
* Payments are charged in US dollars.
* A contributor’s bank or card provider may apply currency-conversion fees if their account is not denominated in US dollars.
Do not invent the legal entity or intended use of funds.
Place placeholders anywhere factual information is still required:
[LEGAL ENTITY]
[REGISTERED ADDRESS]
[CONTACT EMAIL]
[INTENDED USE OF FUNDS]
[REFUND POLICY]
[PAYMENT PROVIDER]
[OPERATING JURISDICTION]
Include a visible transparency link near the payment CTA without making the page visually cluttered.

PRIVACY
Apply data minimization.
Do not publicly expose:
* Full names unless specifically authorized
* Email addresses
* Payment IDs
* Card details
* IP addresses
* Private metadata
Hash email addresses before storing them if the email is only needed for deduplication or analytics.
Add a cookie banner only if non-essential analytics cookies are actually used.
Start without third-party behavioral advertising.

SECURITY
Implement:
* Server-side amount validation
* Stripe webhook signature verification
* Idempotent webhook handling
* Rate limiting
* Input sanitization
* Secure HTTP headers
* Content Security Policy
* Environment-variable validation
* Database transactions
* Error logging without sensitive payment data
* Protection against duplicate checkout submissions
* No secret keys in client-side code
* No card data stored by the application
* Safe handling of refunds
* Production checks that block mock payment mode
* Currency validation to ensure payments are processed in USD
* Integer-only storage and calculation of cents

ACCESSIBILITY
Ensure:
* Keyboard navigation
* Proper labels
* Sufficient color contrast
* Reduced-motion support
* Screen-reader-friendly live totals
* Accessible payment amount selection
* Clear focus states
* Semantic HTML

PERFORMANCE
Optimize for mobile.
Requirements:
* Fast first-page load
* Avoid unnecessary JavaScript
* Optimize fonts
* Avoid layout shift
* Cache public statistics briefly
* Revalidate after confirmed contributions
* Use polling initially rather than building unnecessary real-time infrastructure
* Structure the code so WebSockets or server-sent events could be added later

PWA
Make it installable as a Progressive Web App.
Include:
* Web app manifest
* Placeholder icons
* Theme color
* Standalone display
* Basic offline fallback page
Do not cache payment or admin routes.

ANALYTICS EVENTS
Create a small provider-independent analytics abstraction for:
* page_view
* amount_selected
* custom_amount_entered
* checkout_started
* checkout_completed
* share_clicked
* link_copied
Do not send payment details or personal data to analytics.
Do not send exact contribution amounts to third-party analytics providers.

TESTS
Add tests for:
* Amount validation
* Dollar-to-cent conversion
* Cent-to-dollar display formatting
* Rejection of floating-point storage
* Name sanitization
* Profanity filtering
* Duplicate webhook protection
* Successful payment confirmation
* Failed payment handling
* Refund handling
* Campaign total calculations
* Public API privacy
* Stripe currency being set to USD
* Unexpected payment currencies being rejected or flagged
* Mock mode being blocked in production

SEED DATA
Create one campaign:
Name: ONE MILLION
Slug: one-million
Currency: USD
Target: $1,000,000
Target amount in cents: 100000000
Starting confirmed amount: $0
Starting confirmed amount in cents: 0
Starting contributors: 0
Do not seed fake successful contributions in production.
Use clearly labeled demo contributions only in development.

ENVIRONMENT VARIABLES
Create .env.example containing:
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
PAYMENTS_MODE=mock
PAYMENT_CURRENCY=usd
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ADMIN_EMAIL=
AUTH_SECRET=
LEGAL_ENTITY_NAME=
CONTACT_EMAIL=
Never commit actual secret keys.
The application should validate that:
PAYMENT_CURRENCY=usd
before accepting payments.

DELIVERABLES
Produce:
1. Complete working codebase
2. Prisma schema
3. Database migration
4. Stripe test-mode integration using USD
5. Mock payment mode
6. Responsive pages
7. Protected admin dashboard
8. Essential automated tests
9. .env.example
10. README with exact setup instructions
11. Stripe webhook local-testing instructions
12. Deployment instructions for Vercel and PostgreSQL
13. A launch checklist
14. A list of placeholders I must complete before accepting real payments

IMPLEMENTATION ORDER
Work in this order.
Phase 1
* Scaffold the app
* Build the landing page
* Add responsive styling
* Add the contribution selector
* Use dollar formatting consistently
Phase 2
* Add Prisma and PostgreSQL
* Create the campaign and contribution models
* Store all money as integer cents
* Add public campaign statistics
Phase 3
* Add mock checkout
* Add the success page
* Add sharing functionality
Phase 4
* Add Stripe Checkout in test mode
* Process payments in USD
* Add verified, idempotent webhooks
* Add refunds and failed-payment handling
Phase 5
* Add the admin dashboard
* Add security controls
* Add legal placeholders
* Add automated tests
Phase 6
* Add PWA support
* Improve performance
* Complete documentation

WORKING METHOD
Start by showing me:
1. The proposed folder structure
2. The final database schema
3. The implementation stages
Then create the files and implementation.
Do not stop at a visual mock-up.
Build a functional local MVP with mock payments and Stripe test-mode support.
Work through one phase at a time.
Do not begin the next phase until the current phase:
* Runs locally
* Passes linting
* Passes its relevant tests
* Successfully completes a production build
* Has been summarized for review
Do not invent real transactions, legal information, payment information, contributors, activity, or urgency.
