<!--
Source: https://github.com/sammcj/agentic-coding
Author: Sam McLeod (sammcj)
License: Apache 2.0
Adapted: 2025-11-10
Changes: Added attribution header
-->

# API Design Guidelines Reference

Complete reference for Swift API design conventions based on official Swift.org guidelines.

## Naming Conventions

### Case Conventions
- **Types and protocols**: `UpperCamelCase`
- **Everything else**: `lowerCamelCase` (methods, properties, variables, constants)
- **Acronyms**: Uniform up/down-casing per convention
  - `utf8Bytes`, `isRepresentableAsASCII`, `userSMTPServer`
  - Treat non-standard acronyms as words: `radarDetector`, `enjoysScubaDiving`

### Protocol Naming
- **Descriptive protocols** (what something is): Read as nouns
  - Example: `Collection`
- **Capability protocols**: Use suffixes `able`, `ible`, or `ing`
  - Examples: `Equatable`, `ProgressReporting`
- **Protocol constraint naming**: Append `Protocol` to avoid collision with associated types
  - Example: `IteratorProtocol`

### Variable/Parameter Naming
- **Name by role, not type**
  - ❌ `var string = "Hello"`
  - ✅ `var greeting = "Hello"`
  - ❌ `func restock(from widgetFactory: WidgetFactory)`
  - ✅ `func restock(from supplier: WidgetFactory)`

### Method Naming by Side Effects
- **No side effects**: Read as noun phrases
  - `x.distance(to: y)`, `i.successor()`
- **With side effects**: Read as imperative verb phrases
  - `print(x)`, `x.sort()`, `x.append(y)`

### Mutating/Non-mutating Pairs
- **Verb-based operations**:
  - Mutating: imperative verb (`x.sort()`, `x.reverse()`)
  - Non-mutating: past participle with "ed" (`z = x.sorted()`, `z = x.reversed()`)
  - Or present participle with "ing" when "ed" isn't grammatical (`strippingNewlines()`)
- **Noun-based operations**:
  - Non-mutating: noun (`x = y.union(z)`)
  - Mutating: "form" prefix (`y.formUnion(z)`)

### Factory Methods
- **Begin with `make`**: `x.makeIterator()`

## Core Design Principles

### Fundamentals
1. **Clarity at point of use** is the most important goal
   - Evaluate designs by examining use cases, not just declarations
2. **Clarity over brevity**
   - Brevity is a side-effect, not a goal
   - Compact code comes from the type system, not minimal characters
3. **Write documentation for every declaration**
   - If you can't describe functionality simply, you may have designed the wrong API

### Clear Usage
- **Include words needed to avoid ambiguity**
  - ✅ `employees.remove(at: x)`
  - ❌ `employees.remove(x)` (unclear: removing x?)
- **Omit needless words**
  - Words that merely repeat type information should be omitted
  - ❌ `allViews.removeElement(cancelButton)`
  - ✅ `allViews.remove(cancelButton)`
- **Compensate for weak type information**
  - When parameter is `NSObject`, `Any`, `AnyObject`, or fundamental type, clarify role
  - ❌ `grid.add(self, for: graphics)` (vague)
  - ✅ `grid.addObserver(self, forKeyPath: graphics)` (clear)

### Fluent Usage
- **Methods form grammatical English phrases**
  - `x.insert(y, at: z)` reads as "x, insert y at z"
  - `x.subviews(havingColour: y)` reads as "x's subviews having colour y"
- **First argument in initialisers/factory methods**
  - Should NOT form phrase with base name
  - ✅ `Colour(red: 32, green: 64, blue: 128)`
  - ❌ `Colour(havingRGBValuesRed: 32, green: 64, andBlue: 128)`

## Documentation Requirements

### Structure
- **Use Swift's Markdown dialect**
- **Summary**: Single sentence fragment (no complete sentence)
  - End with period
  - Most important part—many excellent comments are just a great summary
- **Functions/methods**: Describe what it does and returns
  - `/// Inserts \`newHead\` at the beginning of \`self\`.`
  - `/// Returns a \`List\` containing \`head\` followed by elements of \`self\`.`
- **Subscripts**: Describe what it accesses
  - `/// Accesses the \`index\`th element.`
- **Initialisers**: Describe what it creates
  - `/// Creates an instance containing \`n\` repetitions of \`x\`.`
- **Other declarations**: Describe what it is
  - `/// A collection that supports equally efficient insertion/removal at any position.`

### Extended Documentation
- **Parameters section**: Use `- Parameter name:` format
- **Returns**: Use `- Returns:` for complex return values
- **Recognised symbol commands**:
  - Attention, Author, Bug, Complexity, Copyright, Date, Experiment, Important, Invariant, Note, Postcondition, Precondition, Remark, Requires, SeeAlso, Since, Throws, ToDo, Version, Warning

### Special Requirements
- **Document O(1) violations**: Alert when computed property is not O(1)
- **Label tuple members and closure parameters**
  - Provides explanatory power and documentation references
  ```swift
  mutating func ensureUniqueStorage(
    minimumCapacity requestedCapacity: Int,
    allocate: (_ byteCount: Int) -> UnsafePointer<Void>
  ) -> (reallocated: Bool, capacityChanged: Bool)
  ```

## Parameter and Argument Label Guidelines

### Parameter Names
- **Choose names to serve documentation**
  - ✅ `func filter(_ predicate: (Element) -> Bool)`
  - ❌ `func filter(_ includedInResult: (Element) -> Bool)`

### Argument Labels
- **Omit labels when arguments can't be usefully distinguished**
  - `min(number1, number2)`, `zip(sequence1, sequence2)`
- **Value-preserving type conversions**: Omit first label
  - `Int64(someUInt32)`, `String(veryLargeNumber)`
  - Exception: narrowing conversions use descriptive labels
    - `UInt32(truncating: source)`, `UInt32(saturating: valueToApproximate)`
- **Prepositional phrases**: Give first argument a label starting at preposition
  - `x.removeBoxes(havingLength: 12)`
  - Exception when first two arguments are parts of single abstraction:
    - `a.moveTo(x: b, y: c)` (not `a.move(toX: b, y: c)`)
- **Grammatical phrases**: Omit label if first argument forms grammatical phrase
  - `view.dismiss(animated: false)`
  - `words.split(maxSplits: 12)`
- **Label all other arguments**
- **Default parameter placement**: Prefer defaults towards end of parameter list

### Special Cases
- **Prefer `#fileID` over `#filePath`** in production APIs (saves space, protects privacy)
- **Avoid overloading on return type** (causes ambiguities with type inference)
- **Method families sharing base name**: Only when same basic meaning or distinct domains
  - ✅ Multiple `contains()` methods for different geometry types
  - ❌ `index()` with different semantics (rebuild index vs. access row)

## Code Organisation Best Practices

### General Conventions
- **Prefer methods/properties over free functions**
  - Exceptions: no obvious `self`, unconstrained generic, established domain notation (`sin(x)`)
- **Take advantage of defaulted parameters**
  - Simplifies common uses, reduces cognitive burden vs. method families
  - Better than multiple overloads with slight variations
- **Avoid unconstrained polymorphism ambiguities**
  - Be explicit when `Any`/`AnyObject` could cause confusion
  - Example: `append(contentsOf:)` vs. `append(_:)` for arrays

### Terminology
- **Avoid obscure terms** if common word suffices
- **Stick to established meaning** for terms of art
- **Don't surprise experts** with new meanings for technical terms
- **Avoid abbreviations** (non-standard ones are effectively jargon)
- **Embrace precedent**: Use widely understood terms from the domain
  - `sin(x)` over `verticalPositionOnUnitCircleAtOriginOfEndOfRadiusWithAngle(x)`

## Do's and Don'ts

### DO:
- ✅ Write documentation comment for every declaration
- ✅ Focus on clarity at point of use
- ✅ Name by role, not by type
- ✅ Use grammatical English phrases in method names
- ✅ Include all words needed to avoid ambiguity
- ✅ Begin factory methods with "make"
- ✅ Use default parameters to simplify common cases
- ✅ Label tuple members and closure parameters in APIs
- ✅ Document complexity for non-O(1) computed properties
- ✅ Follow case conventions strictly

### DON'T:
- ❌ Include needless words that repeat type information
- ❌ Use obscure terminology when common words work
- ❌ Create grammatical continuity between base name and first argument in initialisers
- ❌ Overload on return type
- ❌ Use method families when default parameters would work better
- ❌ Surprise domain experts by redefining established terms
- ❌ Use non-standard abbreviations
