import React from 'react'
import { Box, Button } from '@mui/material'
import { allExamples, Example } from './examples'
import { DynamicRenderer } from './DynamicRenderer'

export const UBPlayground = () => {
  const [examples, setExamples] = React.useState<Example[]>(allExamples)

  const [number, setNumber] = React.useState(0)
  const [dynamicRendererCompleteSwap, setDynamicRendereCompleteSwap] = React.useState<Example>(
    allExamples[number]
  )

  const [showProps, setShowProps] = React.useState<
    Array<{
      showInputRepresentation: boolean
      showInputFields: boolean
      showData: boolean
    }>
  >(
    examples.map(() => ({
      showInputRepresentation: false,
      showInputFields: false,
      showData: false,
    }))
  )

  const [customExample, setCustomExample] = React.useState({
    title: 'Custom Example',
    inputRepresentation: '',
    inputFields: '',
    data: '',
  })

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  const addCustomExample = () => {
    try {
      const newExample = {
        title: customExample.title,
        inputRepresentation: JSON.parse(customExample.inputRepresentation),
        inputFields: JSON.parse(customExample.inputFields),
        data: JSON.parse(customExample.data),
      }

      setExamples(prev => [...prev, newExample])
      setShowProps(prev => [
        ...prev,
        {
          showInputRepresentation: false,
          showInputFields: false,
          showData: false,
        },
      ])
    } catch {
      alert('Invalid JSON in one or more fields. Please check your input.')
    }
  }

  const [debug, setDebug] = React.useState(false)

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <button onClick={() => setDebug(!debug)}>{debug ? 'Disable Debug' : 'Enable Debug'}</button>
      </Box>
      <Box p={2}>
        <Box sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Create Custom Example</h3>
          <Box sx={{ mb: 2 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Title:
              <input
                type='text'
                value={customExample.title}
                onChange={e => setCustomExample(prev => ({ ...prev, title: e.target.value }))}
                style={{ marginLeft: '8px', padding: '4px', width: '300px' }}
              />
            </label>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Input Representation:</label>
              <textarea
                value={customExample.inputRepresentation}
                onChange={e =>
                  setCustomExample(prev => ({
                    ...prev,
                    inputRepresentation: e.target.value,
                  }))
                }
                style={{ width: '100%', height: '200px', padding: '8px', fontFamily: 'monospace' }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Input Fields:</label>
              <textarea
                value={customExample.inputFields}
                onChange={e =>
                  setCustomExample(prev => ({
                    ...prev,
                    inputFields: e.target.value,
                  }))
                }
                style={{ width: '100%', height: '200px', padding: '8px', fontFamily: 'monospace' }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Data:</label>
              <textarea
                value={customExample.data}
                onChange={e =>
                  setCustomExample(prev => ({
                    ...prev,
                    data: e.target.value,
                  }))
                }
                style={{ width: '100%', height: '200px', padding: '8px', fontFamily: 'monospace' }}
              />
            </Box>
          </Box>

          <button
            onClick={addCustomExample}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Add Custom Example
          </button>
        </Box>

        {examples.map((example, index) => (
          <Box key={index}
            sx={{ mb: 2 }}>
            <details>
              <summary
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                }}
              >
                {example.title}
              </summary>
              <Box sx={{ pl: 2, pt: 2 }}>
                {/* Checkboxes for controlling visibility */}
                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type='checkbox'
                      checked={showProps[index].showInputRepresentation}
                      onChange={e => {
                        setShowProps(prev => {
                          const newProps = [...prev]
                          newProps[index] = {
                            ...newProps[index],
                            showInputRepresentation: e.target.checked,
                          }
                          return newProps
                        })
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    Show Input Representation
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type='checkbox'
                      checked={showProps[index].showInputFields}
                      onChange={e => {
                        setShowProps(prev => {
                          const newProps = [...prev]
                          newProps[index] = {
                            ...newProps[index],
                            showInputFields: e.target.checked,
                          }
                          return newProps
                        })
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    Show Input Fields
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type='checkbox'
                      checked={showProps[index].showData}
                      onChange={e => {
                        setShowProps(prev => {
                          const newProps = [...prev]
                          newProps[index] = {
                            ...newProps[index],
                            showData: e.target.checked,
                          }
                          return newProps
                        })
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    Show Data
                  </label>
                </Box>

                {showProps[index].showInputRepresentation && (
                  <Box sx={{ mb: 2 }}>
                    <h4>Input Representation:</h4>
                    <pre
                      style={{
                        backgroundColor: '#f8f8f8',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px',
                        overflow: 'auto',
                        maxHeight: '300px',
                      }}
                    >
                      {formatJSON(example.inputRepresentation)}
                    </pre>
                  </Box>
                )}

                {showProps[index].showInputFields && (
                  <Box sx={{ mb: 2 }}>
                    <h4>Input Fields:</h4>
                    <pre
                      style={{
                        backgroundColor: '#f8f8f8',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px',
                        overflow: 'auto',
                        maxHeight: '300px',
                      }}
                    >
                      {formatJSON(example.inputFields)}
                    </pre>
                  </Box>
                )}

                {showProps[index].showData && (
                  <Box sx={{ mb: 2 }}>
                    <h4>Data:</h4>
                    <pre
                      style={{
                        backgroundColor: '#f8f8f8',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '10px',
                        overflow: 'auto',
                        maxHeight: '300px',
                      }}
                    >
                      {formatJSON(example.data)}
                    </pre>
                  </Box>
                )}

                <DynamicRenderer
                  debug={debug}
                  fields={example.inputFields}
                  representations={example.inputRepresentation}
                  data={example.data}
                  setData={input => {
                    setExamples(prev => {
                      const newExamples = [...prev]
                      newExamples[index] = {
                        ...newExamples[index],
                        data: input,
                      }
                      return newExamples
                    })
                  }}
                  editable={true}
                  locale={'en'}
                />
              </Box>
            </details>
          </Box>
        ))}
      </Box>
      {
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              disabled={number === allExamples.length - 1}
              onClick={() => {
                setNumber(number + 1)
                setDynamicRendereCompleteSwap(allExamples[number + 1])
              }}
            >
              Next
            </Button>
            <Button
              disabled={number === 0}
              onClick={() => {
                setNumber(number - 1)
                setDynamicRendereCompleteSwap(allExamples[number - 1])
              }}
            >
              Previous
            </Button>
          </Box>
          <DynamicRenderer
            data={dynamicRendererCompleteSwap.data}
            setData={input => {
              setDynamicRendereCompleteSwap(prev => ({ ...prev, data: input }))
            }}
            fields={dynamicRendererCompleteSwap.inputFields}
            representations={dynamicRendererCompleteSwap.inputRepresentation}
            editable={true}
            locale={'en'}
            debug={debug}
          />
        </Box>
      }
    </>
  )
}
