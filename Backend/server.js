const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j Connection Setup
const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password'),
  {
    disableLosslessIntegers: true,
    logging: {
      level: 'debug',
      logger: (level, message) => console.log(`[NEO4J ${level}] ${message}`)
    }
  }
);

const DB_NAME = 'cora-22510092-11';

// Helper function to handle database sessions
async function runQuery(query, params = {}) {
  const session = driver.session({ database: DB_NAME });
  try {
    const result = await session.run(query, params);
    return result;
  } finally {
    await session.close();
  }
}

// 1. Database Info Endpoint
app.get('/api/db-info', async (req, res) => {
  try {
    const result = await runQuery(`SHOW DATABASES`);
    const dbRecord = result.records.find(r => r.get("name") === DB_NAME);
    
    if (!dbRecord) {
      return res.status(404).json({ error: `Database ${DB_NAME} not found` });
    }

    res.json({
      database: dbRecord.get("name"),
      status: dbRecord.get("currentStatus") || "Connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DB Info Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Check Citation Endpoint
app.get('/api/check-citation/:source/:target', async (req, res) => {
  const { source, target } = req.params;
  
  try {
    const result = await runQuery(
      `MATCH (start:Paper {id: $source}), (end:Paper {id: $target})  
       OPTIONAL MATCH path = shortestPath((start)-[:CITES*]->(end))
       RETURN 
         path IS NOT NULL AS cites,
         length(path) AS pathLength`,
      { source: source.toString(), target: target.toString() }
    );

    const record = result.records[0];
    res.json({
      from: source,
      to: target,
      cites: record.get('cites'),
      type: record.get('pathLength') === 1 ? 'Direct' : 
            (record.get('pathLength') > 1 ? 'Indirect' : 'None'),
      pathLength: record.get('pathLength') ?? 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check citation' });
  }
});

// 3. Citation Path Endpoint (optimized)
app.get('/api/citation-path/:sourceId/:targetId', async (req, res) => {
  const { sourceId, targetId } = req.params;
  
  try {
    const result = await runQuery(
      `MATCH (source:Paper {id: $sourceId}), (target:Paper {id: $targetId})
       OPTIONAL MATCH path = shortestPath((source)-[:CITES*]->(target))
       RETURN {
         exists: path IS NOT NULL,
         path: [node IN nodes(path) | node.id],
         degrees: length(path),
         source: source.id,
         target: target.id,
         message: CASE 
           WHEN path IS NULL THEN 'No citation path found'
           WHEN length(path) = 1 THEN 'Direct citation exists'
           ELSE 'Indirect citation path with ' + length(path) + ' hops'
         END
       } AS result`,
      { sourceId: sourceId.toString(), targetId: targetId.toString() }
    );

    const response = result.records[0]?.get('result') || {
      exists: false,
      path: [],
      degrees: 0,
      source: sourceId,
      target: targetId,
      message: 'No citation path found'
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      sourceId,
      targetId
    });
  }
});

// 4. Paper Details Endpoint
app.get('/api/paper/:id', async (req, res) => {
  const paperId = req.params.id;
  
  try {
    const result = await runQuery(
      `MATCH (p:Paper {id: $id}) RETURN p`, 
      { id: paperId.toString() }
    );
    
    const paper = result.records[0]?.get('p');
    if (paper) {
      res.json({
        id: paper.properties.id,
        class: paper.properties.class || null
      });
    } else {
      res.status(404).json({ error: 'Paper not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});
// 5. Custom Cypher Query Endpoint
app.post('/api/custom-query', async (req, res) => {
  console.log("Request received:", req.body); // Adjusted to log body instead of whole req
  const { query } = req.body;
  const session = driver.session({ database: DB_NAME });

  try {
    const result = await session.run(query);
    const records = result.records.map(record => record.toObject());
    res.json(records);
  } catch (error) {
    console.error("Custom Query Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`- DB Info:       /api/db-info`);
  console.log(`- Check Citation /api/check-citation/:source/:target`);
  console.log(`- Citation Path: /api/citation-path/:sourceId/:targetId`);
  console.log(`- Paper Details: /api/paper/:id`);
});

// Test Neo4j connection on startup
driver.verifyConnectivity()
  .then(info => console.log('✅ Neo4j connection verified:', info))
  .catch(err => console.error('❌ Neo4j connection failed:', err));