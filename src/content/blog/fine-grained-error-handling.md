---
title: Fine-grained Error Handling in TypeScript
description: This post discuss about creating custom error classes for fine-grained error handling in TypeScript.
pubDate: "2023-02-28"
isPublished: true
---

## The Problem

Error handling is often an afterthought on our web development projects. Errors in TS look like this:

```tsx
try {
  throw new Error("An error is encountered")
} catch (error) {
  console.log(error)
}
```

The `error` is typed as `unknown` in the code above so it is really hard to handle it unless we can narrow its type.

As a sample scenario, let’s say we have a post API endpoint that we call to make a payment to complete a transaction. This endpoint does the following internally to validate first before allowing the transaction:

- Checks whether the current user is permitted to perform the payment transaction
- Checks whether the payment details are valid
  - Is card not yet expired?
  - Is card number and CVV both correct

## Proposed Solution

The solution was inspired by [Cory House](https://twitter.com/housecor)’s tweet:

We often structure our API services per domain:

- `/user` endpoints are located in `/services/user.ts`
- `/payment` endpoints are located in `/services/payment.ts`

With this in mind, errors should be tightly coupled with their respective domains as well. We can create custom error classes per domain (or even per service) to achieve this.

Borrowing some code from the tweet above, we can do the following:

- Create a base error class to ensure that all our errors follow the same form
- Create a custom error class and extend the base class

### Creating the ErrorBase class

```ts
interface ErrorWithCause<TName, TCause> {
  name: TName
  message: string
  cause?: TCause
}

export class ErrorBase<TName extends string, TCause = any> extends Error {
  public name: TName
  public message: string
  public cause?: TCause

  constructor(error: ErrorWithCause<TName, TCause>) {
    super()
    this.name = error.name
    this.message = error.message || ""
    this.cause = error.cause
  }
}
```

The `ErrorBase` class is quite simple, it just extends the `Error` class with name, message & optional cause properties.

What’s worth explaining here are the generic types `TName` & `TCause`. This generics, particularly `TName` would help us strongly type our error class. To illustrate this, let’s create a file `user-error.ts` that should house all user domain related errors.

user-error.ts

```typescript
type UserErrorType = "USER_PERMISSION_ERROR" | "INVALID_USER_ERROR"

export class UserError extends ErrorBase<UserErrorType>

const userErrorMessages: Record<UserErrorType, string> = {
	USER_PERMISSION_ERROR: "This user is not permitted to perform this operation.",
	INVALID_USER_ERROR: "The user is invalid"
}

export const getUserErrorMessage = (errorType: UserErrorType) => {
	return userErrorMessages[errorType]
}
```

Let’s breakdown the contents of the file:

- `UserErrorType` - possible user error types
- `UserError` - custom error class that is expected to be thrown for all instances of user errors
  - We are assigning `UserErrorType` as the only possible string values for `UserError.name` property. This is what makes this completely type safe by specifying which particular error names does the `UserError` class contains.
- `userErrorMessages` - a Record object which has `UserErrorType` strings as keys and string as values. This creates a map of what should be displayed in the UI for each user error type
- `getUserErrorMessage` - a function that returns the error message for the supplied user error type.

For the given problem from the start, aside from the user error, we should also create an error class for the `payment` domain.

payment-error.ts

```ts
type PaymentErrorType = "CARD_EXPIRED" | "INVALID_CARD_DETAILS"

export class PaymentError extends ErrorBase<PaymentErrorType>

const paymentErrorMessages: Record<PaymentErrorType, string> = {
	CARD_EXPIRED: "Your credit card is already expired.",
	INVALID_CARD_DETAILS: "The credit card details you entered are invalid."
}

export const getPaymentErrorMessage = (errorType: PaymentErrorType) => {
	return paymentErrorMessages[errorType]
}
```

Payment endpoint service function

`payment-service.ts`

```ts
export const postPayment = async (paymentBody: PaymentBody) => {
  const { data, error } = await fetcher("/payment", {
    method: "POST",
    body: JSON.stringify(paymentBody),
  })
}
```

Let’s say the `error` data returned by the endpoint has the following structure:

```json
{
  "type": "payment",
  "code": "INVALID_CARD_DETAILS" // can also be CARD_EXPIRED
}
```

It can also be of type `user` if it is a permission error

```json
{
  "type": "user",
  "code": "USER_PERMISSION_ERROR"
}
```

The assumption is that all of the error.code values returned by our endpoint are all configured in the error types in FE (`UserErrorType` & `PaymentErrorType`).

On the same service function, we can now use our custom error classes for a much more granular error handling approach:

payment-service.ts

```ts
export const postPayment = async (paymentBody: PaymentBody) => {
  const { data, error } = await fetcher("/payment", {
    method: "POST",
    body: JSON.stringify(paymentBody),
  })

  if (error) {
    // The assumption is that all of the error.code values returned by our
    // endpoint are all configured in the error types
    // (UserErrorType & PaymentErrorType).
    switch (error.type) {
      case "user":
        throw new UserError({ name: error.code })
      case "payment":
        throw new PaymentError({ name: error.code })
      default:
        throw new Error("Some generic error message")
    }
  }

  return data
}
```

For the following error scenarios, we want the UI to react depending on what type of error is thrown. For our use case, we expect the UI to behave like the following:

- If it is a user permission error, it should redirect to the home page and display a toast with an appropriate error message
- If it is a card expiration error, it means that the credit card configured in the account has expired, the user should be redirected to the update payment info page with an appropriate toast message.
- If it is an invalid card details error, just display a toast message and clear the credit card info fields.

The following code implements the scenarios mentioned above:

```ts
try {
  const res = await postPayment(formData)
} catch (error) {
  // error.name check is strongly typed, it can only either be
  // "USER_PERMISSION_ERROR" or "INVALID_USER_ERROR"
  if (error instanceof UserError && error.name === "USER_PERMISSION_ERROR") {
    redirectWithToastMsg("/", getUserErrorMessage(error.name))
  }

  // error.name check is strongly typed, it can only either be
  // "CARD_EXPIRED" or "INVALID_CARD_DETAILS"
  if (error instanceof PaymentError) {
    if (error.name === "CARD_EXPIRED") {
      redirectWithToastMsg(
        "/update-payment",
        getPaymentErrorMessage(error.name),
      )
    }

    if (error.name === "INVALID_CARD_DETAILS") {
      toast(getPaymentErrorMessage(error.name))
      clearPaymentFields()
    }
  }
}
```

As illustrated in the code above, the `error` is still of type `unknown`. However , we can always narrow down its type and on our case, we are checking if it is an instance of our custom error classes.

With this approach, error handling is more type safe, maintainable and more granular. There is a clear definition of possible error scenarios per domain.
