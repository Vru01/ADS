# 22510092_Assignment_11


1.    LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/ngshya/datasets/master/cora/cora_content.csv' AS line FIELDTERMINATOR ',' CREATE (:Paper {id: line.paper_id, class: line.label})

or 
       LOAD CSV WITH HEADERS FROM 'file:///cora_content.csv' AS line FIELDTERMINATOR ',' CREATE (:Paper {id: line.paper_id, class: line.label})



2.      LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/ngshya/datasets/master/cora/cora_cites.csv' AS line FIELDTERMINATOR ',' MATCH (citing_paper:Paper {id: line.citing_paper_id}),(cited_paper:Paper {id: line.cited_paper_id}) CREATE (citing_paper)-[:CITES]->(cited_paper)


or

 LOAD CSV WITH HEADERS FROM 'file:///cora_cites.csv' AS line FIELDTERMINATOR ','  MATCH (citing_paper:Paper {id: line.citing_paper_id}), (cited_paper:Paper {id: line.cited_paper_id}) CREATE (citing_paper)-[:CITES]->(cited_paper)


MATCH p=()-->() RETURN p LIMIT 25

MATCH p=()-[r:CITES]->() RETURN p LIMIT 25

