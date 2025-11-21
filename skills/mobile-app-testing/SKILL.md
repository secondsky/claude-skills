---
name: mobile-app-testing
description: Implements comprehensive mobile testing strategies including unit tests, UI automation, and performance testing across platforms. Use when setting up test infrastructure, writing E2E tests, or establishing testing standards for mobile apps.
---

# Mobile App Testing

Implement comprehensive testing strategies for mobile applications.

## Testing Pyramid

| Level | Tools | Coverage |
|-------|-------|----------|
| Unit | Jest, XCTest, JUnit | 70% |
| Integration | Detox, Espresso | 20% |
| E2E | Appium, Detox | 10% |

## React Native (Jest + Detox)

```javascript
// Unit test
describe('CartService', () => {
  it('calculates total correctly', () => {
    const cart = new CartService();
    cart.addItem({ price: 10, quantity: 2 });
    expect(cart.getTotal()).toBe(20);
  });
});

// E2E test (Detox)
describe('Login flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('dashboard'))).toBeVisible();
  });
});
```

## iOS (XCTest)

```swift
func testLoginSuccess() {
    let app = XCUIApplication()
    app.launch()

    app.textFields["email"].tap()
    app.textFields["email"].typeText("user@example.com")
    app.secureTextFields["password"].typeText("password123")
    app.buttons["Login"].tap()

    XCTAssertTrue(app.staticTexts["Welcome"].exists)
}
```

## Android (Espresso)

```kotlin
@Test
fun loginSuccess() {
    onView(withId(R.id.email)).perform(typeText("user@example.com"))
    onView(withId(R.id.password)).perform(typeText("password123"))
    onView(withId(R.id.loginButton)).perform(click())
    onView(withId(R.id.dashboard)).check(matches(isDisplayed()))
}
```

## Best Practices

- Test business logic first (unit tests)
- Mock external dependencies
- Test both success and failure paths
- Automate critical user flows
- Maintain >80% code coverage
- Test on real devices periodically

## Avoid

- Testing implementation details
- Hardcoded test data
- Interdependent tests
- Skipping error case testing
