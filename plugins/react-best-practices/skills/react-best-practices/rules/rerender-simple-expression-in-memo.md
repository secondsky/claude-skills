# Rule Summary

**Title:** Do not wrap a simple expression with a primitive result type in useMemo

**Impact:** LOW-MEDIUM (wasted computation on every render)

**Key Principle:** When dealing with straightforward expressions that return primitive types (boolean, number, string), avoid wrapping them in `useMemo`. The overhead of the hook and dependency comparison typically outweighs any performance benefit.

**The Problem:**
The example shows an unnecessary `useMemo` wrapping a simple boolean OR operation. "Calling `useMemo` and comparing hook dependencies may consume more resources than" performing the simple calculation itself.

**The Solution:**
Compute the value directly without memoization. In the corrected example, `isLoading` is assigned the result of `user.isLoading || notifications.isLoading` without any hook wrapper.

**Tags:** rerender, useMemo, optimization
