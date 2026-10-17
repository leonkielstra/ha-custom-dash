class HaCustomDashStrategy extends HTMLElement {
  static async generate(config, hass) {
    const groups = new Map();

    for (const entityId of Object.keys(hass.states).sort()) {
      const entry = hass.entities?.[entityId];
      if (entry?.hidden || entry?.entity_category) {
        continue;
      }

      const domain = entityId.split(".")[0];
      if (!groups.has(domain)) {
        groups.set(domain, []);
      }
      groups.get(domain).push(entityId);
    }

    const cards = Array.from(groups, ([domain, entities]) => ({
      type: "entities",
      title: domain.replaceAll("_", " "),
      show_header_toggle: false,
      entities,
    }));

    return {
      views: [{
        title: config.title || "Home",
        path: "home",
        cards: cards.length ? cards : [{
          type: "markdown",
          content: "No entities available.",
        }],
      }],
    };
  }
}

customElements.define(
  "ll-strategy-dashboard-ha-custom-dash",
  HaCustomDashStrategy
);
