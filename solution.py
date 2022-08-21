from collections import defaultdict
from heapq import heappush, heappop

def solution(nodes, edges, weights, k):
    graph = defaultdict(defaultdict(int))

    for src, dest in range(len(edges)):
        for i in range(k + 1):
            graph[src, min(k, i)][(dest, min(k, i + 1))] = weights[src, dest]

    pq = [(1, 0)] # node_id, road_traversed
    visited = set()
    dist = defaultdict(lambda: float('inf'))
    dist[(1, 0)] = 0

    while pq:
        node, road = heappop(pq)

        if (node, road) in visited:
            continue

        visited.add((node, road))
        for neighbor, road_traversed in graph[node, road]:
            if dist[(neighbor, road_traversed)] > dist[(node, road)] + graph[node, road][neighbor, road_traversed]:
                dist[(neighbor, road_traversed)] = dist[(node, road)] + graph[node, road][neighbor, road_traversed]
                heappush(pq, (neighbor, road_traversed))

    return min(dist[(len(nodes), road)] for road in range(k))