# Authentication with Google NextJS/next-auth v4

Test project to try it out and understand what goes where and if there are any gotchas

Install a new nextjs app

npx create-next-app@latest

## Setup Prisma ORM

Install prisma orm:

npm install typescript ts-node @types/node \--save-dev  
npm install prisma \--save-dev  
npx prisma init \--datasource-provider mysql

Update .gitignore, add .env to it.

(Create a mysql database to use with this test project, it’s on devdb. Dbname nextauth, user nextauth, pwd nextauthABC)

In .env, the database connection string should be:

DATABASE\_URL="mysql://nextauth:nextauth@192.168.90.9:3306/nextauth"

(We use the ipaddress as the server can’t see our local dns servers, the server is in the DMZ)

Create a file in prisma/client.ts and place this code into it:

`import { PrismaClient } from '@prisma/client'`

`const prismaClientSingleton = () => {`  
  `return new PrismaClient()`  
`}`

`declare const globalThis: {`  
  `prismaGlobal: ReturnType<typeof prismaClientSingleton>;`  
`} & typeof global;`

`const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()`

`export default prisma`

`if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma`

There’s an intellisense error \- the next steps will sort that out.

Add a test model to the prisma.schema

model test {  
  id   Int    @id @default(autoincrement())  
  name String  
}

Then:

npm install @prisma/client  
npx prisma migrate dev

Fix any screw ups

We should be up and running with prisma.

## Setup Google Oauth

Step 1 is to get it working with localhost:3800 (I moved port)  
Step 2 is to get it working with an external domain, ‘production’

[https://www.youtube.com/watch?v=Uo3GoqSs8Vc](https://www.youtube.com/watch?v=Uo3GoqSs8Vc)

Google: search: google cloud, select … or [https://console.cloud.google.com/](https://console.cloud.google.com/)

Projects \-\> New Project  
Select the Project  
Select APIs & Services  
Credentials  
Create Credentials  
OAuth Client ID  
Configure Consent Screen  
External

NOTE Internal might be the best option for inside-track … but they have an issue with domains\! Their app will need to run on the inside-track.net domain for internal to work. And we will need to ensure that app.inside-track.net isn’t redirected to their main website.

Fill the required fields.  
Save and continue

Add or Remove Scopes  
Check /auth/userinfo.email  
Check /auth/userinfo.profile  
Save and continue

Add test users  
Save and Continue

That bit is done, now create Credentials menu on the Left hand Side

Credentials  
Create Credentials (at the top bar)  
Select OAuth Client Id

ApplicationType: Web Application  
Name Lucia Test Client

Authorised JavaScript origins: [http://localhost:3800](http://localhost:3800)

Authorised redirect URIs: [http://localhost:3800/](http://localhost:3800/api/oauth/google/callback)api/auth/callback/google

Create

Save the Client auth information from the pop-up screen:

ClientID:
Client Secret:

Ok

Copy those values to the .env file as
GOOGLE\_CLIENT\_ID=  
GOOGLE\_CLIENT\_SECRET=

## Next-auth v4

Install:  
npm install next-auth  
npm install @prisma/client @next-auth/prisma-adapter  
npm install prisma \--save-dev

In .env we add:  
NEXTAUTH\_URL=
NEXTAUTH\_SECRET=
GOOGLE\_CLIENT\_ID=  
GOOGLE\_CLIENT\_SECRET=

Create the route handler at: app/api/auth/\[...nextauth\]/route.ts

import { authOptions } from "@/app/auth/options"  
import NextAuth from "next-auth"

const handler \= NextAuth(authOptions)

export { handler as GET, handler as POST }

Create an app/auth folder and in there:

app/auth/options.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";  
import { NextAuthOptions } from "next-auth";  
import GoogleProvider from "next-auth/providers/google";  
import prisma from "@/prisma/client";

export const authOptions: NextAuthOptions \= {  
    adapter: PrismaAdapter(prisma),  
    providers: \[  
        GoogleProvider({  
            clientId: process.env.GOOGLE\_CLIENT\_ID\!,  
            clientSecret: process.env.GOOGLE\_CLIENT\_SECRET\!  
        })  
    \],  
    session: {  
        strategy: "jwt"  
    }  
}

app/auth/AuthProvider.ts

"use client";  
import { SessionProvider } from "next-auth/react";  
export default SessionProvider;

Add to the prisma.schema

//-- Next-Auth.js \--

model Account {  
  id                 String  @id @default(cuid())  
  userId             String  
  type               String  
  provider           String  
  providerAccountId  String  
  refresh\_token      String? @db.Text  
  access\_token       String? @db.Text  
  expires\_at         Int?  
  token\_type         String?  
  scope              String?  
  id\_token           String? @db.Text  
  session\_state      String?  
  oauth\_token\_secret String?  
  oauth\_token        String?

  user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

  @@unique(\[provider, providerAccountId\])  
}

model Session {  
  id           String   @id @default(cuid())  
  sessionToken String   @unique  
  userId       String  
  expires      DateTime  
  user         User     @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)  
}

model User {  
  id            String    @id @default(cuid())  
  name          String?  
  email         String?   @unique  
  emailVerified DateTime?  
  image         String?  
  accounts      Account\[\]  
  sessions      Session\[\]  
}

model VerificationToken {  
  identifier String  
  token      String   @unique  
  expires    DateTime

  @@unique(\[identifier, token\])  
}

Followed by  
npx prisma migrate dev

In app/layout.ts wrap the {children} in the AuthProvider

\<AuthProvider\>{children}\</AuthProvider\>

In the root, create middleware.ts

import middleware from "next-auth/middleware";  
export default middleware;  
// matching will go to ???  
export const config \= {  
    matcher: \["/blob", "/blob/:path\*"\],  
};

That’s it.