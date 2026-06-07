<template>
  <!--
    Atmospheric backdrop: near-black --background base with two low-alpha
    green radial glows using --accent for depth, replacing former ad-hoc
    slate/violet/fuchsia literals.
    Requirements: 2.3, 2.4, 13.6
  -->
  <div
    class="app-shell min-h-screen antialiased font-sans"
  >
    <NuxtPage />

    <!-- Author attribution (Requirement 13.6) -->
    <a
      href="https://www.linkedin.com/in/bagus-erlangga-a3a7b137b/"
      target="_blank"
      rel="noopener noreferrer"
      class="attribution-link fixed bottom-4 right-4 z-50 text-xs font-medium"
    >
      Dibuat oleh Bagus Erlangga
    </a>
  </div>
</template>

<style>
/*
  App shell atmospheric background.
  Uses --background (near-black) as the dominant base with two low-alpha
  radial green glows from --accent for atmospheric depth.
*/
.app-shell {
  background-color: hsl(var(--background));
  background-image:
    radial-gradient(
      ellipse 70% 50% at 20% 10%,
      hsl(var(--accent) / 0.07) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 60% 45% at 80% 85%,
      hsl(var(--accent) / 0.05) 0%,
      transparent 65%
    );
  color: hsl(var(--foreground));
}

/* Attribution link — token-driven color with hover transition */
.attribution-link {
  color: hsl(var(--muted-foreground));
  transition: color var(--motion-base) var(--ease-standard);
}
.attribution-link:hover {
  color: hsl(var(--accent));
}
</style>
