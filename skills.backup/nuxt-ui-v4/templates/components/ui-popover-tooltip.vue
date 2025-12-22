<template>
  <div class="p-6">
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold mb-2">Popover & Tooltip Examples</h2>
        <p class="text-dimmed">Demonstrates Popover (click) and Tooltip (hover) components</p>
      </div>

      <!-- Tooltips (Hover) -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Tooltips</h3>
        <div class="flex flex-wrap gap-4">
          <UTooltip text="This is a tooltip">
            <UButton>Hover me</UButton>
          </UTooltip>

          <UTooltip text="Tooltip on top" placement="top">
            <UButton variant="outline">Top</UButton>
          </UTooltip>

          <UTooltip text="Tooltip on bottom" placement="bottom">
            <UButton variant="outline">Bottom</UButton>
          </UTooltip>

          <UTooltip text="Tooltip on left" placement="left">
            <UButton variant="outline">Left</UButton>
          </UTooltip>

          <UTooltip text="Tooltip on right" placement="right">
            <UButton variant="outline">Right</UButton>
          </UTooltip>
        </div>
      </div>

      <!-- Popovers (Click) -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Popovers</h3>
        <div class="flex gap-4">
          <UPopover>
            <UButton>Click for Popover</UButton>

            <template #content>
              <div class="p-4 w-64">
                <h4 class="font-semibold mb-2">Popover Title</h4>
                <p class="text-sm text-dimmed">
                  This is a popover with rich content. You can add any components here.
                </p>
                <UButton size="sm" class="mt-3">Action</UButton>
              </div>
            </template>
          </UPopover>

          <UPopover>
            <UButton icon="i-heroicons-information-circle" variant="ghost" />

            <template #content>
              <div class="p-4 max-w-sm">
                <p class="text-sm">
                  This is helpful information displayed in a popover.
                </p>
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <!-- Icon Tooltips -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Icon Tooltips</h3>
        <div class="flex gap-2">
          <UTooltip text="Delete">
            <UButton icon="i-heroicons-trash" variant="ghost" color="error" />
          </UTooltip>

          <UTooltip text="Edit">
            <UButton icon="i-heroicons-pencil" variant="ghost" />
          </UTooltip>

          <UTooltip text="Share">
            <UButton icon="i-heroicons-share" variant="ghost" />
          </UTooltip>
        </div>
      </div>
    </div>
  </div>
</template>
