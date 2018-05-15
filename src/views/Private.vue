<template lang="pug">
	<div class="view--Private">
		<template v-if="$auth &amp;&amp; $auth.check()">
			<h1>This view is private only visible</h1>
			<p>Lorem</p>
		</template>
		<template v-if="!$auth || !$auth.check()">
			<h1>Loading auth</h1>
		</template>
	</div>
</template>

<script>
export default {
	name: "Private",
	meta() {
		return {
			title: "Private",
			description: "This is the meta description for the private page"
		}
	}
}
</script>
