import React, { useState } from 'react'
import { tDynamicRendererProps } from './types'
import { useNodesProcessor } from './hooks/useNodesProcessor'
import { DynamicRendererInner } from 'universal-reporting/DynamicRendererInner'
import { Box, CircularProgress, Modal, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, IconButton } from '@mui/material'
import { tDependencyGraph, tDependencyGraphNode } from '@smambu/lib.constants'

const TableHeaders: React.FC = () => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>Status</TableCell>
        <TableCell>Target</TableCell>
        <TableCell>Entity</TableCell>
        <TableCell>Expression</TableCell>
        <TableCell>Expression Errors</TableCell>
        <TableCell>Expression Dependencies</TableCell>
        <TableCell>Child Dependencies</TableCell>
        <TableCell>Sub Nodes Definitions</TableCell>
        <TableCell>Sub Nodes</TableCell>
        <TableCell>Policy</TableCell>
      </TableRow>
    </TableHead>
  )
}

interface SubNodesModalProps {
  open: boolean
  onClose: () => void
  subNodes: tDependencyGraph
  title: string
}

const SubNodesModal: React.FC<SubNodesModalProps> = ({ open, onClose, subNodes, title }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby='sub-nodes-modal'
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 24,
        p: 3,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6'
            component='h2'>
            {title}
          </Typography>
          <IconButton onClick={onClose}
            size='small'>
            ✕
          </IconButton>
        </Box>

        {subNodes.length === 0
          ? (
            <Typography variant='body2'
              color='text.secondary'>
              Nessun sub-node definito
            </Typography>
          )
          : (
            <TableContainer component={Paper}
              sx={{ fontSize: '0.75rem' }}>
              <Table>
                <TableHeaders />
                <TableBody>
                  {subNodes.map((node, index) => (
                    <SubNodeRow key={`${node.target}-${index}`}
                      node={node} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
      </Box>
    </Modal>
  )
}

interface SubNodeRowProps {
  node: tDependencyGraphNode
}

const SubNodeRow: React.FC<SubNodeRowProps> = ({ node }) => {
  const [subNodesModalItem, setSubNodesModalItem] = useState<tDependencyGraph | null>(null)

  return (
    <>
      <TableRow>
        <TableCell>{node.status}</TableCell>
        <TableCell>{node.target}</TableCell>
        <TableCell>{node.entity}</TableCell>
        <TableCell>{`${JSON.stringify(node.expression, null, 2)}`}</TableCell>
        <TableCell>{node.expressionErrors}</TableCell>
        <TableCell>{node.expressionDeps.join(', ') || 'None'}</TableCell>
        <TableCell>{node.childDeps.join(', ') || 'None'}</TableCell>
        <TableCell>
          {node.subNodesDefinitions && node.subNodesDefinitions.length > 0
            ? (
              <Button
                variant='outlined'
                size='small'
                onClick={() => setSubNodesModalItem(node.subNodesDefinitions)}
                sx={{ fontSize: '0.7rem' }}
              >
                View Sub Nodes Definitions ({node.subNodesDefinitions.length})
              </Button>
            )
            : (
              'None'
            )}
        </TableCell>
        <TableCell>
          {node.subNodes && node.subNodes.length > 0
            ? (
              <Button
                variant='outlined'
                size='small'
                onClick={() => setSubNodesModalItem(node.subNodes)}
                sx={{ fontSize: '0.7rem' }}
              >
                View Sub Nodes ({node.subNodes.length})
              </Button>
            )
            : (
              'None'
            )}
        </TableCell>
        <TableCell>{`${node.policy.horizontal} - ${node.policy.vertical}`}</TableCell>
      </TableRow>

      {subNodesModalItem !== null && (
        <SubNodesModal
          open={subNodesModalItem !== null}
          onClose={() => setSubNodesModalItem(null)}
          subNodes={subNodesModalItem}
          title={`Sub Nodes for: ${node.target}`}
        />
      )}
    </>
  )
}

export const DynamicRenderer: React.FC<tDynamicRendererProps> = ({
  fields,
  representations,
  data,
  setData,
  editable,
  locale,
  debug,
}) => {
  const { nodes, values, updateData } = useNodesProcessor(
    fields,
    representations,
    data,
    setData,
    debug
  )

  if (values.fields.length === 0 || values.representation.length === 0)
    return <LightweightLoader open={true} />
  return (
    <>
      {debug && <Box sx={{ p: 0 }}>
        <TableContainer component={Paper}
          sx={{ fontSize: '0.75rem' }}>
          <Table>
            <TableHeaders />
            <TableBody>
              {nodes.map(node => {
                return <SubNodeRow key={node.target}
                  node={node} />
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {debug && <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>RESOLVED Data:</label>
            <textarea
              value={JSON.stringify(values.data, null, 2)}
              disabled
              style={{ width: '100%', height: '200px', padding: '8px', fontFamily: 'monospace' }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>RESOLVED Fields:</label>
            <textarea
              value={JSON.stringify(values.fields, null, 2)}
              disabled
              style={{ width: '100%', height: '200px', padding: '8px', fontFamily: 'monospace' }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>RESOLVED Representation:</label>
            <textarea
              value={JSON.stringify(values.representation, null, 2)}
              disabled
              style={{ width: '100%', height: '200px', padding: '8px', fontFamily: 'monospace' }}
            />
          </Box>
        </Box>}
      </Box>
      }
      <DynamicRendererInner
        wholePayload={values.data}
        data={values.data}
        setData={(updatedData: { path: string; value: any }) => {
          if (debug)
            // eslint-disable-next-line no-console
            console.log('### DYNAMIC RENDERER SET DATA', updatedData)
          updateData(updatedData)
        }}
        fields={values.fields}
        representation={values.representation}
        editable={editable}
        locale={locale}
        path={''}
      />
    </>
  )
}

interface LightweightLoaderProps {
  open: boolean
}

const LightweightLoader: React.FC<LightweightLoaderProps> = ({ open }) => {
  return (
    <Modal
      open={open}
      aria-labelledby='loading-spinner-modal'
      aria-describedby='loading-spinner-and-backdrop'
      disableEscapeKeyDown
      hideBackdrop={false}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <Box sx={{ outline: 'none' }}>
        <CircularProgress color='primary' />
      </Box>
    </Modal>
  )
}
