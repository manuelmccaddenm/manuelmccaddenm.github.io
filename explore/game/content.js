/** The original graph has 24 portfolio entries plus one campus landmark. */
export function cityProjects(portfolio, graph) {
  const projects = Object.fromEntries(portfolio.map((p) => [p.id, p]));
  for (const id of graph.stops) {
    if (projects[id]) continue;
    const node = graph.nodes.find((n) => n.id === id);
    if (node?.type !== "landmark")
      throw new Error(`Missing project content: ${id}`);
    projects[id] = {
      id,
      label: node.label,
      title: node.title,
      cluster: node.cluster,
      kind: "landmark",
      meta: "Applied mathematics & data science · ITAM · Mexico City",
      body: [
        "The campus is the starting point of the district. From here, the streets connect twenty-four projects and workstreams by the methods and subjects they share. Open the district map to find a destination, or follow a street and explore.",
      ],
      links: [],
    };
  }
  return projects;
}
