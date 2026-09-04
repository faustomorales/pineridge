<script>
  import "../styles/brand.css";
  import "../styles/base.css";
  import logo from "../assets/logo.svg";
</script>

<svelte:head>
  <link rel="icon" type="image/svg+xml" href={logo} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
</svelte:head>

<slot />
